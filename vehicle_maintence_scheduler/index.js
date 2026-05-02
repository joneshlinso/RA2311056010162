const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Log, requestLogger } = require('../logging_middleware/logger');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(requestLogger);

// Internal API links for the evaluation server
const DEPOT_URL = "http://20.207.122.201/evaluation-service/depot";
const VEHICLE_LIST_URL = "http://20.207.122.201/evaluation-service/vehicles";

/**
 * Optimizing maintenance slots using a Dynamic Programming approach.
 * Basically a Knapsack problem where:
 * Weight = hours needed for service
 * Value = priority/risk score of the vehicle
 */
function getBestMaintenancePlan(vehicleData, availableMechanicHours) {
    const totalVehicles = vehicleData.length;
    const hoursCap = Math.floor(availableMechanicHours);
    
    // table[i][j] stores the max risk we can handle with j hours using i vehicles
    const table = Array(totalVehicles + 1).fill(0).map(() => Array(hoursCap + 1).fill(0));

    for (let i = 1; i <= totalVehicles; i++) {
        const current = vehicleData[i - 1];
        const costInHours = Math.ceil(current.serviceDuration || 3); // some don't have hours, so we assume 3
        const impactValue = Math.floor(current.riskScore || 0);

        for (let h = 0; h <= hoursCap; h++) {
            if (costInHours <= h) {
                // Should we include this vehicle or not?
                const includeImpact = impactValue + table[i - 1][h - costInHours];
                const excludeImpact = table[i - 1][h];
                table[i][h] = Math.max(includeImpact, excludeImpact);
            } else {
                table[i][h] = table[i - 1][h];
            }
        }
    }

    // Now we backtrack to see which specific cars made the cut
    const chosenOnes = [];
    let remainingHours = hoursCap;
    for (let i = totalVehicles; i > 0; i--) {
        if (table[i][remainingHours] !== table[i - 1][remainingHours]) {
            const selected = vehicleData[i - 1];
            chosenOnes.push(selected);
            remainingHours -= Math.ceil(selected.serviceDuration || 3);
        }
    }

    return {
        efficiencyScore: table[totalVehicles][hoursCap],
        scheduledVehicles: chosenOnes
    };
}

app.post('/api/v1/scheduler/run', async (req, res) => {
    try {
        await Log("backend", "info", "service", "Scheduler triggered - fetching external data");

        // 1. Get capacity from Depot
        let maxHours = 40; // fallback default
        try {
            const dResponse = await fetch(DEPOT_URL);
            if (dResponse.ok) {
                const dData = await dResponse.json();
                maxHours = dData.totalHours || 40;
            }
        } catch (err) {
            await Log("backend", "warn", "service", "Depot API down, using default 40h");
        }

        // 2. Get vehicle list
        let rawVehicles = [];
        try {
            const vResponse = await fetch(VEHICLE_LIST_URL);
            if (vResponse.ok) {
                rawVehicles = await vResponse.json();
            } else {
                rawVehicles = req.body.vehicles || [];
            }
        } catch (err) {
            await Log("backend", "warn", "service", "Vehicle API down, falling back to request body");
            rawVehicles = req.body.vehicles || [];
        }

        if (!rawVehicles || rawVehicles.length === 0) {
            return res.status(400).json({ status: "error", message: "No vehicles to process" });
        }

        // 3. Pre-process and calculate Risk Scores
        const preparedList = rawVehicles.map(car => {
            const lastService = new Date(car.lastServiceDate);
            const gapDays = Math.floor((new Date() - lastService) / (1000 * 3600 * 24));
            
            // Heuristic for risk: more days since service + higher mileage = higher priority
            const score = (gapDays * 0.4) + (car.mileage * 0.02);
            return { ...car, riskScore: score };
        });

        // 4. Run the DP optimization
        const plan = getBestMaintenancePlan(preparedList, maxHours);

        await Log("backend", "info", "service", `Optimized plan generated with ${plan.scheduledVehicles.length} vehicles`);

        return res.status(200).json({
            success: true,
            totalMechanicHours: maxHours,
            ...plan
        });

    } catch (e) {
        await Log("backend", "error", "service", `Critical failure in scheduler: ${e.message}`);
        return res.status(500).json({ success: false, error: "Something went wrong on our end" });
    }
});

const SERVICE_PORT = process.env.PORT || 5000;
app.listen(SERVICE_PORT, () => {
    // Note: No console.log here as per project rules
    Log("backend", "info", "config", `Maintenance Scheduler microservice active on port ${SERVICE_PORT}`);
});
