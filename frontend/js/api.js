const API = "http://localhost/Pallone_Oro/backend/";

async function createPlayer() {
    const name = document.getElementById("name").value;
    const gender = document.getElementById("gender").value;
    const nationality = document.getElementById("nationality").value;

    await fetch(API + "index.php/create_player", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({name, gender, nationality})
    });

    alert("Giocatore creato!");
}

async function simulate() {
    const id = 1; // temporaneo
    const res = await fetch(API + "index.php/simulate_month?id=" + id);
    const data = await res.json();
    alert("Gol: " + data.goals + " | Assist: " + data.assists);
}
