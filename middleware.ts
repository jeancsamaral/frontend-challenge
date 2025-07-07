import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Middleware function that runs for protected routes
    console.log("Middleware executed for:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Return true if the user is authenticated
        return !!token
      },
    },
  }
)

// Configure which routes require authentication
export const config = {
  matcher: [
    "/editor/:path*",
    "/api/slides/:path*",
    // Não proteger rotas necessárias para estudantes:
    // - /api/responses/* (para estudantes enviarem/carregarem respostas)
    // - /api/students/* (para login/dados de estudantes)
    // - /api/sessions/* (para verificar salas)
  ]
} 