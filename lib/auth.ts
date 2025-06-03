import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔍 AUTH DEBUG: Starting authorization...')
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ AUTH DEBUG: Missing email or password')
          return null
        }

        console.log('📧 AUTH DEBUG: Looking for user:', credentials.email)

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          console.log('🔍 AUTH DEBUG: Prisma query completed')
          console.log('👤 AUTH DEBUG: User result:', user ? 'Found' : 'Not found')

          if (!user) {
            console.log('❌ AUTH DEBUG: User not found')
            return null
          }

          console.log('✅ AUTH DEBUG: User found:', user.email, 'Role:', user.role)

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('🔑 AUTH DEBUG: Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('❌ AUTH DEBUG: Invalid password')
            return null
          }

          console.log('✅ AUTH DEBUG: Returning user object')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('💥 AUTH DEBUG: Error during authorization:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ""
        session.user.role = token.role as string || ""
      }
      return session
    },
    async signIn({ user }) {
      // Allow all sign-ins - redirect handled on frontend
      return true
    }
  },
  pages: {
    signIn: "/auth/login",
  },
}
