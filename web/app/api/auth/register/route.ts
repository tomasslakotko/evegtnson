import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  username: z.string().min(3).optional(),
  organizationName: z.string().optional(),
  organizationSlug: z.string().optional(),
  accountType: z.enum(["individual", "corporate"]).default("individual"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Registration request received:", { 
      accountType: body.accountType, 
      organizationName: body.organizationName, 
      organizationSlug: body.organizationSlug,
      email: body.email,
      hasName: !!body.name,
      hasPassword: !!body.password,
    });
    
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return NextResponse.json(
        { 
          message: "Invalid input data", 
          errors: parsed.error.issues.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }
    
    const { email, password, name, username, organizationName, organizationSlug, accountType } = parsed.data;
    console.log("Parsed data:", { email, accountType, organizationName, organizationSlug });

    // Validate corporate account requirements
    if (accountType === "corporate") {
      if (!organizationName || organizationName.length < 2) {
        return NextResponse.json(
          { message: "Organization name is required and must be at least 2 characters" },
          { status: 400 }
        );
      }
      if (!organizationSlug || organizationSlug.length < 3) {
        return NextResponse.json(
          { message: "Organization slug is required and must be at least 3 characters" },
          { status: 400 }
        );
      }
      if (!/^[a-z0-9-]+$/.test(organizationSlug)) {
        return NextResponse.json(
          { message: "Organization slug can only contain lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (accountType === "corporate" && organizationName && organizationSlug) {
      console.log("Creating corporate account...");
      
      // Check if organization slug is taken
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
      });

      if (existingOrg) {
        console.log("Organization slug already taken:", organizationSlug);
        return NextResponse.json(
          { message: "Organization slug already taken" },
          { status: 400 }
        );
      }

      console.log("Creating organization:", { name: organizationName, slug: organizationSlug });
      
      // Create organization first
      let organization;
      try {
        organization = await prisma.organization.create({
          data: {
            name: organizationName,
            slug: organizationSlug,
          },
        });
        console.log("Organization created:", organization.id);
      } catch (orgError: any) {
        console.error("Error creating organization:", orgError);
        throw orgError;
      }

      // Generate unique username if not provided
      let finalUsername = username || email.split("@")[0];
      let usernameCounter = 1;
      
      console.log("Checking username uniqueness:", finalUsername);
      
      // Ensure username is unique and not null
      while (finalUsername && await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${email.split("@")[0]}${usernameCounter}`;
        usernameCounter++;
        if (usernameCounter > 1000) {
          // Safety check to prevent infinite loop
          finalUsername = `${email.split("@")[0]}${Date.now()}`;
          break;
        }
      }

      console.log("Final username:", finalUsername);
      console.log("Creating user with organization:", { 
        email, 
        organizationId: organization.id,
        username: finalUsername,
        hasPassword: !!hashedPassword,
        name,
        role: "owner"
      });

      // Then create user with organization
      let newUser;
      try {
        const userData: any = {
          email,
          password: hashedPassword,
          name,
          role: "owner",
          organizationId: organization.id,
        };
        
        // Only add username if we have one
        if (finalUsername) {
          userData.username = finalUsername;
        }
        
        console.log("User data to create:", { ...userData, password: "[HIDDEN]" });
        
        newUser = await prisma.user.create({
          data: userData,
        });
        console.log("User created successfully:", newUser.id);
      } catch (userError: any) {
        console.error("Error creating user:", userError);
        // Try to clean up organization if user creation fails
        try {
          await prisma.organization.delete({ where: { id: organization.id } });
        } catch (cleanupError) {
          console.error("Error cleaning up organization:", cleanupError);
        }
        throw userError;
      }

      return NextResponse.json(
        { 
          message: "Organization created successfully", 
          organization: { id: organization.id, name: organization.name },
          user: { id: newUser.id, email: newUser.email }
        },
        { status: 201 }
      );
    } else {
      // Individual registration
      // Generate unique username
      let finalUsername = username || email.split("@")[0];
      let usernameCounter = 1;
      
      while (finalUsername && await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${email.split("@")[0]}${usernameCounter}`;
        usernameCounter++;
        if (usernameCounter > 1000) {
          finalUsername = `${email.split("@")[0]}${Date.now()}`;
          break;
        }
      }

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          username: finalUsername || undefined,
        },
      });

      return NextResponse.json(
        { message: "User created successfully", user: { id: user.id, email: user.email } },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("========== REGISTRATION ERROR ==========");
    console.error("Error type:", typeof error);
    console.error("Error name:", error?.name);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    if (error?.meta) {
      console.error("Error meta:", JSON.stringify(error.meta, null, 2));
    }
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("========================================");
    
    // Handle Prisma errors
    if (error?.code === "P2002") {
      const target = error.meta?.target;
      if (Array.isArray(target)) {
        if (target.includes("email")) {
          return NextResponse.json(
            { message: "Email already exists" },
            { status: 400 }
          );
        }
        if (target.includes("username")) {
          return NextResponse.json(
            { message: "Username already exists" },
            { status: 400 }
          );
        }
        if (target.includes("slug")) {
          return NextResponse.json(
            { message: "Organization slug already taken" },
            { status: 400 }
          );
        }
      }
      return NextResponse.json(
        { message: "A unique constraint was violated", target },
        { status: 400 }
      );
    }
    
    // Handle Zod validation errors
    if (error?.name === "ZodError" || error?.issues) {
      const issues = error.issues || [];
      return NextResponse.json(
        { 
          message: "Invalid input data", 
          errors: issues.map((issue: any) => ({
            path: issue.path?.join(".") || issue.path,
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }
    
    // Return detailed error in development
    const errorMessage = error?.message || String(error);
    const errorDetails = process.env.NODE_ENV === "development" 
      ? { 
          message: errorMessage,
          name: error?.name,
          code: error?.code,
          stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
        }
      : { message: "Something went wrong" };
    
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    );
  }
}

