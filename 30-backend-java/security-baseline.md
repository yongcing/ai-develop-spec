# Java：安全基線實作細節

> 語言無關原則：[/30-backend/security-baseline.md](../30-backend/security-baseline.md)。
> 本檔只補 Java / Spring Security 實作。

## 雙 chain 設定

End-user chain（OAuth2 / OIDC + JWT）與 service-to-service chain（HTTP Basic Auth）走獨立 `SecurityFilterChain`。

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** Service-to-service: HTTP Basic Auth on /api/v1/internal/** */
    @Bean @Order(1)
    SecurityFilterChain internalChain(HttpSecurity http,
                                      InternalUserDetailsService internalUsers) throws Exception {
        return http
            .securityMatcher("/api/v1/internal/**")
            .csrf(csrf -> csrf.disable())     // Basic Auth + 純 JSON API；非瀏覽器
            .httpBasic(b -> b.realmName("internal"))
            .userDetailsService(internalUsers)
            .authorizeHttpRequests(a -> a.anyRequest().hasAuthority("SCOPE_internal"))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }

    /** End-user: OAuth2 Resource Server (JWT from IdP) */
    @Bean @Order(2)
    SecurityFilterChain endUserChain(HttpSecurity http) throws Exception {
        return http
            .oauth2ResourceServer(o -> o.jwt(j -> j.decoder(idpJwtDecoder())))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/v1/public/**").permitAll()
                .anyRequest().authenticated())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
```

### Internal users 來源

`InternalUserDetailsService` 從 K8s Secret / env 載入：

```java
@Service
public class InternalUserDetailsService implements UserDetailsService {
    private final Map<String, UserDetails> users;

    public InternalUserDetailsService(@Value("${internal.users}") String json,
                                      PasswordEncoder encoder) {
        // json 範例: [{"username":"order-worker","secret":"$2a$12$..."}]
        // secret 已 bcrypt-hash，由 ops 部署時生 + 寫入 Secret
        this.users = parseFromJson(json, encoder);
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        var u = users.get(username);
        if (u == null) throw new UsernameNotFoundException(username);
        return u;
    }
}
```

**secret 在 K8s Secret 內以 bcrypt hash 儲存**（不存明碼）；運維輪換時重新 hash + 部署。

## 授權

- `@PreAuthorize("hasRole('XXX')")` 寫在 service 的 public method 上（**不**寫在 controller 上）
- 資源所有權：service 內顯式 `if (!order.ownerId().equals(currentUserId())) throw new AccessDeniedException(...)` 或用 Specification 把 owner filter 加進 JPA query

## 套件

- `spring-boot-starter-security`
- `spring-boot-starter-oauth2-resource-server`（end-user JWT）
- 密碼 hash：`BCryptPasswordEncoder(12)`（cost ≥ 12）
- Rate limit：Resilience4j RateLimiter / Bucket4j + Redis

## 規則（Java 特有）

- ✅ End-user JWT decoder bean 化（`JwtDecoder`），dev / prod 用不同 issuer URI
- ✅ S2S secret 以 bcrypt hash 存 K8s Secret，**不存明碼**
- ✅ Internal chain 強制 `STATELESS` session（避免 server 端存 session）
- ❌ 在 controller 加 `@PreAuthorize`（應該在 service 層）
- ❌ 用 `permitAll()` 開放整段 path 而沒寫 ADR
- ❌ 把 s2s 改回 JWT（已是規格決策；要改走 ADR）
