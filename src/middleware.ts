import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ req, token }) {
      if (
        !token?.id ||
        typeof token.securityStamp !== "string" ||
        token.securityStamp.length === 0 ||
        token.sessionInvalid
      ) {
        return false;
      }

      if (req.nextUrl.pathname.startsWith("/admin")) {
        return Boolean(token.isAdmin);
      }

      return true;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/projects/:path*/edit",
  ],
};
