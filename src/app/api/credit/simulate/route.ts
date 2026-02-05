import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    calculateCredit,
    CreditCalculationInput,
    getDefaultInterestRate,
    calculateDefaultAdminFee,
    calculateDefaultInsuranceFee,
    validateCreditApplication,
    VehicleCategory,
    VehicleCondition
} from "@/lib/kernel";
import { creditSimulationSchema } from "@/lib/validations";

// POST - Calculate credit simulation
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate basic input
        const validationResult = creditSimulationSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed", details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const data = validationResult.data;
        const vehicleCategory = (body.vehicleCategory as VehicleCategory) || "motor";
        const vehicleCondition = (body.vehicleCondition as VehicleCondition) || "baru";

        // Validate credit application using kernel
        const validation = validateCreditApplication(
            data.vehiclePrice,
            data.downPayment,
            data.tenor,
            vehicleCategory,
            vehicleCondition
        );

        if (!validation.isValid) {
            return NextResponse.json(
                { error: "Credit validation failed", details: validation.errors },
                { status: 400 }
            );
        }

        // Get defaults if not provided
        const interestRate = data.interestRate || getDefaultInterestRate(vehicleCategory, vehicleCondition, data.tenor);
        const adminFee = data.adminFee ?? calculateDefaultAdminFee(data.vehiclePrice, vehicleCategory);
        const insuranceFee = data.insuranceFee ?? calculateDefaultInsuranceFee(
            data.vehiclePrice,
            vehicleCategory,
            vehicleCondition,
            data.tenor
        );

        // Calculate using kernel - SINGLE SOURCE OF TRUTH
        const input: CreditCalculationInput = {
            vehiclePrice: data.vehiclePrice,
            downPayment: data.downPayment,
            tenor: data.tenor,
            interestRate,
            adminFee,
            insuranceFee
        };

        const result = calculateCredit(input);

        return NextResponse.json({
            ...result,
            vehicleCategory,
            vehicleCondition,
            warnings: validation.warnings
        });

    } catch (error) {
        console.error("Error calculating credit:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
