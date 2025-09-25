package com.ivancroce.backend.security;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.exceptions.UnauthorizedException;
import com.ivancroce.backend.services.UserService;
import com.ivancroce.backend.tools.JWTTools;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JWTCheckerFilter extends OncePerRequestFilter {

    @Autowired
    private JWTTools jwtTools;

    @Autowired
    private UserService userService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        //AUTHENTICATION
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            throw new UnauthorizedException("Insert a valid token");

        String extractedToken = authHeader.replace("Bearer ", "");
        jwtTools.verifyToken(extractedToken);

        //AUTHORIZATION
        String userId = jwtTools.extractId(extractedToken);
        User authorizedUser = this.userService.findById(Long.valueOf(userId));

        Authentication authentication = new UsernamePasswordAuthenticationToken(authorizedUser, null, authorizedUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        AntPathMatcher matcher = new AntPathMatcher();
        String path = request.getServletPath();
        String method = request.getMethod();

        // Public auth endpoints
        if (matcher.match("/api/auth/**", path)) {
            return true;
        }

        // Public endpoints for the Affinity Report
        if ("GET".equals(method)) {
            if (matcher.match("/api/countries/simple", path) ||
                    matcher.match("/api/countries/*/representative-program", path) ||
                    matcher.match("/api/countries/*/has-special-program", path) ||
                    matcher.match("/api/countries/*", path) && !path.contains("/search")) {
                return true;
            }
        }

        if (matcher.match("/api/feedback", path) && "POST".equals(method)) {
            return true;
        }

        // Swagger UI public
        if (matcher.match("/swagger-ui/**", path) ||
                matcher.match("/api-docs/**", path) ||
                matcher.match("/swagger-ui.html", path) ||
                matcher.match("/v3/api-docs/**", path)) {
            return true;
        }

        return false;
    }
}