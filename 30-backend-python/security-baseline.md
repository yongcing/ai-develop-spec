# Python：安全基線實作細節

> 語言無關原則：[/30-backend/security-baseline.md](../30-backend/security-baseline.md)。
> 本檔只補 Python / FastAPI 實作。

## 雙 auth chain 設定

跨語言契約：service-to-service endpoint **必須**位於 `/api/v1/internal/**` 之下（見 shared baseline）。
End-user 走 OIDC + JWT；s2s 走 HTTP Basic Auth + K8s Secret。

```python
# api/deps.py
import secrets
from typing import Annotated
from fastapi import Depends, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPAuthorizationCredentials, HTTPBearer
import jwt   # PyJWT
from passlib.context import CryptContext

from .config import settings
from .domain.exceptions import AuthenticationError, ForbiddenError

# ── End-user (OIDC JWT) ──────────────────────────────────────────
bearer = HTTPBearer(auto_error=False)

async def require_end_user(creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> dict:
    if creds is None or creds.scheme.lower() != "bearer":
        raise AuthenticationError("missing bearer token")
    try:
        jwks_client = jwt.PyJWKClient(settings.idp_jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(creds.credentials).key
        claims = jwt.decode(
            creds.credentials,
            key=signing_key,
            algorithms=["RS256", "ES256"],
            audience=settings.idp_audience,
            issuer=settings.idp_issuer,
        )
    except jwt.InvalidTokenError as e:
        raise AuthenticationError(f"invalid token: {e}") from e
    return claims


# ── Service-to-service (HTTP Basic) ──────────────────────────────
basic = HTTPBasic(auto_error=False, realm="internal")
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

async def require_internal(
    creds: Annotated[HTTPBasicCredentials | None, Depends(basic)],
    request: Request,
) -> str:
    """Returns service-id (username) on success."""
    if not request.url.path.startswith("/api/v1/internal/"):
        # 雙重保險：dependency 也檢查 path 前綴
        raise ForbiddenError("internal endpoint must be under /api/v1/internal/")
    if creds is None:
        raise AuthenticationError("missing basic auth")
    # settings.internal_users: dict[str, str]  (username → bcrypt hash)
    hashed = settings.internal_users.get(creds.username)
    if hashed is None:
        # constant-time fallback to avoid username enumeration
        pwd.verify(creds.password, "$2b$12$invalidsaltinvalidsaltinvalidsaltinval")
        raise AuthenticationError("invalid credentials")
    if not pwd.verify(creds.password, hashed):
        raise AuthenticationError("invalid credentials")
    return creds.username
```

### Router 分流

```python
# api/v1/routers/orders.py  (end-user)
from fastapi import APIRouter, Depends
from ...deps import require_end_user

router = APIRouter(prefix="/api/v1/orders", tags=["orders"],
                   dependencies=[Depends(require_end_user)])

# api/v1/routers/internal/orders.py  (s2s)
from fastapi import APIRouter, Depends
from ....deps import require_internal

router = APIRouter(prefix="/api/v1/internal/orders", tags=["internal:orders"],
                   dependencies=[Depends(require_internal)])
```

### Internal users 來源

K8s Secret 注入 JSON（`internal.users`）：

```json
{
  "order-worker": "$2b$12$xxxx...",
  "etl-pipeline": "$2b$12$yyyy..."
}
```

Pydantic settings 讀進來：

```python
# config.py
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # End-user OIDC
    idp_issuer: str
    idp_audience: str
    idp_jwks_url: str

    # s2s Basic Auth
    internal_users: dict[str, str]   # username -> bcrypt hash, from K8s Secret JSON

    # Misc
    database_url: SecretStr
    redis_url: str

settings = Settings()
```

**secret 在 K8s Secret 內以 bcrypt hash 儲存**（不存明碼）；運維輪換時重新 hash + 部署。

## 角色檢查（end-user only）

```python
def require_role(role: str):
    async def _dep(claims: Annotated[dict, Depends(require_end_user)]) -> dict:
        roles = claims.get("realm_access", {}).get("roles", [])
        if role not in roles:
            raise ForbiddenError(f"requires role: {role}")
        return claims
    return _dep

@router.delete("/{order_id}", dependencies=[Depends(require_role("admin"))])
async def delete_order(...): ...
```

s2s 不走 role-based authz：每組 service credential 對應一個 internal-only 用途，授權靠 path / endpoint 列舉。

## 資源所有權檢查

寫在 **service 層**，**不**在 router：

```python
async def get_order(order_id: str, current_user_id: str, repo: OrderRepo) -> Order:
    order = await repo.get(order_id)
    if order is None:
        raise NotFoundError(f"order {order_id} not found")
    if order.owner_id != current_user_id:
        raise ForbiddenError("not the owner")
    return order
```

## 密碼 hash

```python
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

def hash_password(plain: str) -> str:
    return pwd.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd.verify(plain, hashed)
```

cost ≥ 12（NIST 建議）。

## Rate limiting

兩種選擇，**走 Redis** 較佳（跟 Java 一致）：

- `fastapi-limiter`（Redis bucket）— 推薦
- `slowapi`（in-process，僅單 instance）— 開發 / PoC

```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis.asyncio as redis

# main.py startup
await FastAPILimiter.init(redis.from_url(settings.redis_url))

@router.post("/login", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def login(...): ...
```

## Secrets

- `pydantic-settings` 讀環境變數，**不**讀 `.env` in prod（K8s Secret → env）
- 禁止把 secret 寫進 `config.py` 或任何 `git` 追蹤的檔案
- `.env.example` 提供 schema 但只放 placeholder
- `SecretStr` 包敏感設定，誤印 log 時顯示 `**********`

## CORS

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,   # list[str]，**不**用 ["*"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
)
```

## Audit log

獨立 logger，與 app log 分流：

```python
import structlog
audit = structlog.get_logger("audit")

audit.info("login.success", user_id=user.id, ip=request.client.host)
audit.info("internal.call", service_id="order-worker", endpoint=request.url.path)
audit.warning("authz.denied", user_id=user.id, resource=order_id, role_required="admin")
```

s2s 呼叫一律 audit log（包含 service-id），方便事後追蹤。

## 規則（Python 特有）

- ✅ End-user JWT 用 **PyJWT** 解碼（**禁用** `python-jose`，已決議因 maintenance 風險）
- ✅ s2s 用 `HTTPBasic` + `passlib` bcrypt 驗證；secret 必 bcrypt hash 後存 K8s Secret
- ✅ 兩條 auth chain 用 router prefix + dependency 雙隔離
- ✅ `SecretStr` 包所有敏感設定
- ❌ Router 內手寫 `if token is None: raise HTTPException(...)` — 改用 dependency
- ❌ s2s 用明碼比對 secret（必走 `pwd.verify` constant-time）
- ❌ 未掛 dependency 的 router（必須掛 `require_end_user` 或 `require_internal`；公開 endpoint 在獨立 `public_router.py`）
- ❌ Token / 密碼 / PII 寫進 log
- ❌ `verify=False` 跳過 TLS / JWT signature 檢查
- ❌ 把 s2s 改回 JWT（已是規格決策；要改走 ADR）
