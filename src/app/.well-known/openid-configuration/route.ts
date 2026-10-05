import { NextResponse } from "next/server";
import { SCOPES, issuer } from "@/lib/oidc/config";

export const dynamic = "force-dynamic";

/** Découverte OpenID Connect : les applications (le blog) y trouvent les adresses du fournisseur */
export function GET() {
    const iss = issuer();
    return NextResponse.json(
        {
            issuer: iss,
            authorization_endpoint: `${iss}/oauth/authorize`,
            token_endpoint: `${iss}/oauth/token`,
            userinfo_endpoint: `${iss}/oauth/userinfo`,
            jwks_uri: `${iss}/oauth/jwks`,
            end_session_endpoint: `${iss}/oauth/logout`,
            response_types_supported: ["code"],
            grant_types_supported: ["authorization_code"],
            subject_types_supported: ["public"],
            id_token_signing_alg_values_supported: ["RS256"],
            token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
            code_challenge_methods_supported: ["S256"],
            scopes_supported: Object.keys(SCOPES),
            claims_supported: ["sub", "iss", "aud", "exp", "iat", "auth_time", "nonce", "username", "preferred_username", "name", "picture", "email", "email_verified", "role"],
            authorization_response_iss_parameter_supported: true,
        },
        { headers: { "Cache-Control": "public, max-age=3600" } }
    );
}
