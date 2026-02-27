// Garbage Monitoring App

// Function to handle garbage monitoring
function monitorGarbage() {
    const garbageLevels = getGarbageLevels(); // Function to simulate garbage levels
    if (garbageLevels > threshold) {
        alert('Garbage levels are high!');
        notifyUsers(); // Function to notify users
    }
}

// Simulated function to fetch garbage levels
function getGarbageLevels() {
    // Simulated data for garbage levels
    return Math.floor(Math.random() * 100);
}

// Function to notify users
function notifyUsers() {
    console.log('Notifying users about high garbage levels...');
}

// Set a threshold for garbage levels
const threshold = 75;

// Set interval for monitoring garbage levels
setInterval(monitorGarbage, 30000); // Check every 30 seconds