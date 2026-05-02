function scheduleMaintenance(vehicles) {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
        throw new Error("Invalid vehicle data provided");
    }

    const currentDate = new Date();

    const evaluatedVehicles = vehicles.map(vehicle => {
        const lastServiceDate = new Date(vehicle.lastServiceDate);
        
        const timeDiff = Math.abs(currentDate - lastServiceDate);
        const daysSinceService = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); 
        
        let riskScore = 0;
        riskScore += (daysSinceService * 0.5);
        riskScore += (vehicle.mileage * 0.01);

        return {
            ...vehicle,
            daysSinceService,
            riskScore
        };
    });

    evaluatedVehicles.sort((a, b) => b.riskScore - a.riskScore);

    return evaluatedVehicles;
}

module.exports = { scheduleMaintenance };
