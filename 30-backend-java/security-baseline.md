# Java：安全基線實作細節

> 語言無關原則：[/30-backend/security-baseline.md](../30-backend/security-baseline.md)。
> 本檔只補 Java / Spring Security 實作。

## 雙 chain 設定

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean @Order(1)
    SecurityFilterChain internalChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/v1/internal/**")
            .oauth2ResourceServer(o -> o.jwt(j -> j.decoder(internalJwtDecoder())))
            .authorizeHttpRequests(a -> a.anyRequest().hasAuthority("SCOPE_internal"))
            .build();
    }

    @Bean @Order(2)
    SecurityFilterChain endUserChain(HttpSecurity http) throws Exception {
        return http
            .oauth2ResourceServer(o -> o.jwt(j -> j.decoder(idpJwtDecoder())))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/v1/public/**").permitAll()
                .anyRequest().authenticated())
            .build();
    }
}
```

兩個 `SecurityFilterChain` bean 用 `@Order` 排序，`securityMatcher` 切流量。

## 授權

- `@PreAuthorize("hasRole('XXX')")` 寫在 service 的 public method 上（**不**寫在 controller 上）
- 資源所有權：service 內顯式 `if (!order.ownerId().equals(currentUserId())) throw new AccessDeniedException(...)` 或用 Specification 把 owner filter 加進 JPA query

## 套件

- `spring-boot-starter-security`
- `spring-boot-starter-oauth2-resource-server`
- 密碼 hash：`BCryptPasswordEncoder(12)`（cost ≥ 12）
- Rate limit：Resilience4j RateLimiter / Bucket4j + Redis

## 規則（Java 特有）

- ✅ JWT 解碼器 bean 化（`JwtDecoder`），dev / prod 用不同 issuer URI
- ❌ 在 controller 加 `@PreAuthorize`（應該在 service 層）
- ❌ 用 `permitAll()` 開放整段 path 而沒寫 ADR
