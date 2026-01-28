const apiKey = "AIzaSyBKIrUMMFx9l8VYuFRHeS4YY78fZIh72KY";
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(err);
    }
}

listModels();
