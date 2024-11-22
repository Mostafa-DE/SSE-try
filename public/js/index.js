// Simulate user already authenticated and has a clientId\
const clientId = "123123";

// Open SSE connection
const eventSource = new EventSource(`/events?clientId=${clientId}`);

eventSource.onmessage = (event) => {
  try {
    const { message, lastUpdated } = JSON.parse(event.data);
    if (!lastUpdated) return;

    const lastUpdatedDIV = document.getElementById("lastUpdated");
    lastUpdatedDIV.innerText = `
        User last connected: ${new Date(parseInt(lastUpdated)).toLocaleString()}
    `;

    const messageDIV = document.getElementById("message");
    messageDIV.innerText = message;
  } catch (error) {
    console.log(error);
  }
};

document.getElementById("answerButton").addEventListener("click", () => {
  const answer = document.querySelector('input[name="answer"]:checked').value;

  if (!answer) return;

  fetch("/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clientId: clientId, answer: answer }),
  });
});

(async () => {
  const res = await fetch("/questions");
  const { questions } = await res.json();

  if (!questions) return;
  document.getElementById("question").innerText = questions[0].title;
  document.getElementById("options").innerHTML = `
      ${questions[0].options.map(
        (op, idx) =>
          `
            <label>
                <input type="radio" name="answer" value=${idx}>
                ${op}
            </label>
            <br>
          `
      )}

  `;
})();
