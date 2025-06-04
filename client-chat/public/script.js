const URL = "http://localhost:3000";

class ClientChat {
    constructor() {
        this.config = null;
        this.ccSorry = "Sorry, I don't have the answer";
        this.ccHistory = [];
        this.ccNew = document.getElementById("cc-new");
        this.ccChat = document.getElementById("cc-chat");
        this.ccPrompt = document.getElementById("cc-prompt");
        this.ccSend = document.getElementById("cc-send");
        this.ccRespond = false;

        this.ccNew.onclick = () => this.#newConversation();

        this.ccPrompt.focus();
        this.ccPrompt.oninput = () => {
            this.ccPrompt.style.height = "auto";
            if(this.ccPrompt.scrollHeight < window.innerHeight/4) {
                this.ccPrompt.style.height = this.ccPrompt.scrollHeight + "px";
                this.ccPrompt.style.overflowY = "hidden";
            } else {
                this.ccPrompt.style.height = (window.innerHeight/4)+"px";
                this.ccPrompt.style.overflowY = "scroll";
            }

            this.ccSend.disabled = (this.ccPrompt.value.trim().length > 0 && !this.ccRespond) ? false : true;
        };

        let prevKey = null;
        this.ccPrompt.onkeydown = (event) => {
            if(event.key == "Enter" && prevKey != "Shift" && !this.ccRespond) {
                event.preventDefault();
                this.ccSend.click();
            }
            prevKey = (event.key == "Enter" && prevKey == "Shift") ? "Shift" : event.key;
        };

        this.ccSend.onclick = () => this.#sendMessage();
        this.#decryptConfig();
        this.#initLocalStorage();
    }

    async #decryptConfig() {
        await fetch("./config.json")
            .then(res => res.json())
            .then(json => {
                this.config = json
            }).catch(err => console.error(err));
    }

    #newConversation() {
        this.ccChat.innerHTML = ClientChat.CC_LOGO;
        this.ccPrompt.value = "";
        this.ccSend.disabled = true;
        this.ccConversationId = null; 
        this.ccHistory = [];
    }

    #initLocalStorage() {
        if(localStorage.getItem("cc-localStorage")) {
            this.ccChat.innerHTML = "";
            this.ccHistory = JSON.parse(localStorage.getItem("cc-localStorage")) ?? [];
            this.ccHistory.forEach(message => {
                if(message.user == "user") {
                    this.#printUserMessage(message.message);
                } else if(message.user == "bot") {
                    this.#printAIMessage(message.message, false);
                };
            });
        }
    }

    #updateLocalStorage() {
        localStorage.setItem("cc-localStorage", JSON.stringify(this.ccHistory));
    }

    #printUserMessage(message) {
        let div1 = document.createElement("div");
        let div2 = document.createElement("div");
        div2.textContent = message;
        div1.append(div2);
        this.ccChat.append(div1);
    }

    #sendMessage() {
        this.ccRespond = true;
        this.ccPrompt.disabled = true;
        if(this.ccHistory.length == 0) this.ccChat.innerHTML = "";
        this.ccHistory.push({user: "user", message: this.ccPrompt.value.trim()});
        this.#printUserMessage(this.ccPrompt.value.trim());
        this.ccPrompt.value = "";
        this.ccPrompt.style.height = "auto";
        this.ccSend.disabled = true;
        this.ccChat.scrollTo(0, this.ccChat.scrollHeight);

        this.#updateLocalStorage();
        this.#requestAPI();
    }

    #printAIMessage(message, typetext=true) {
        const TYPETEXT = (elmt, text, callback = null, index = 0) => {
            elmt.textContent += text[index];
            if(index < text.length-1) {
                setTimeout(() => TYPETEXT(elmt, text, callback, index+1), 20);
            } else if(callback) {
                callback();
            }
        };

        let div1 = document.createElement("div");
        let button1 = document.createElement("button");
        let button2 = document.createElement("button");
        div1.innerHTML = ClientChat.CC_LOGO;
        button1.classList.add("cc-copy");
        button1.innerHTML = ClientChat.CC_COPY;
        button2.classList.add("cc-speak");
        button2.innerHTML = ClientChat.CC_SPEAK;

        let div2 = document.createElement("div");
        if(typetext) {
            TYPETEXT(div2, message, () => {
                this.ccRespond = false;
                this.ccPrompt.disabled = false;
                this.ccSend.disabled = this.ccPrompt.value.trim().length > 0 ? false : true;
                this.ccChat.scrollTo(0, this.ccChat.scrollHeight);
                div1.append(button2);
            });
        } else {
            div2.textContent = message;
            div1.append(button2);
        }
        button1.onclick = () => {
            let _message = button1.previousElementSibling.textContent;
            navigator.clipboard.writeText(_message);
        };
        button2.onclick = () => {
            let _message = button1.previousElementSibling.textContent;
            let utterance = new SpeechSynthesisUtterance(_message);
            speechSynthesis.speak(utterance);
        };
        div1.append(div2, button1);

        this.ccChat.append(div1);
        this.ccChat.scrollTo(0, this.ccChat.scrollHeight);
    }

    #respondMessage(message = this.ccSorry) {
        this.ccHistory.push({user: "bot", message: message});
        this.#printAIMessage(message);
        this.#updateLocalStorage();
    }

    #extractData(model, response) {
        let value = null;
        for (const key in model) {
            if (model[key] === "$response" && response[key] !== undefined) {
                value = response[key];
            } else if(typeof response[key] === "object" && response[key] !== null) {
                const nestedValue = this.#extractData(model[key], response[key]);
                if (nestedValue !== null) { value = nestedValue; }
            }
        }
        return value ?? this.ccSorry;
    }

    #requestAPI() {
        let body = { "prompt": this.ccHistory[this.ccHistory.length-1].message.replace(/"/g, (match) => '\\' + match) };

        fetch(`${URL}/api`, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(body)
        }).then(response => response.json()).then(data => {
            if(data.error) {
                this.#respondMessage();
            } else {
                let content = this.#extractData(JSON.parse(this.config.responseAPI.body), data);
                if(content.length > 0) {
                    this.#respondMessage(content);
                } else {
                    this.#respondMessage();
                }
            }
        }).catch(error => {
            console.error(error);
            this.#respondMessage();
        });
    }

    static CC_LOGO = `
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="30" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2" />
            <rect x="6" y="6" width="22" height="2" fill="currentColor" />
            <rect x="6" y="12" width="22" height="2" fill="currentColor" />
            <rect x="10" y="24" width="30" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2" />
            <rect x="14" y="28" width="22" height="2" fill="currentColor" />
            <rect x="14" y="34" width="22" height="2" fill="currentColor" />
        </svg>
    `

    static CC_COPY = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor" />
        </svg>
    `

    static CC_SPEAK = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 4.9099C11 4.47485 10.4828 4.24734 10.1621 4.54132L6.67572 7.7372C6.49129 7.90626 6.25019 8.00005 6 8.00005H4C3.44772 8.00005 3 8.44776 3 9.00005V15C3 15.5523 3.44772 16 4 16H6C6.25019 16 6.49129 16.0938 6.67572 16.2629L10.1621 19.4588C10.4828 19.7527 11 19.5252 11 19.0902V4.9099ZM8.81069 3.06701C10.4142 1.59714 13 2.73463 13 4.9099V19.0902C13 21.2655 10.4142 22.403 8.81069 20.9331L5.61102 18H4C2.34315 18 1 16.6569 1 15V9.00005C1 7.34319 2.34315 6.00005 4 6.00005H5.61102L8.81069 3.06701ZM20.3166 6.35665C20.8019 6.09313 21.409 6.27296 21.6725 6.75833C22.5191 8.3176 22.9996 10.1042 22.9996 12.0001C22.9996 13.8507 22.5418 15.5974 21.7323 17.1302C21.4744 17.6185 20.8695 17.8054 20.3811 17.5475C19.8927 17.2896 19.7059 16.6846 19.9638 16.1962C20.6249 14.9444 20.9996 13.5175 20.9996 12.0001C20.9996 10.4458 20.6064 8.98627 19.9149 7.71262C19.6514 7.22726 19.8312 6.62017 20.3166 6.35665ZM15.7994 7.90049C16.241 7.5688 16.8679 7.65789 17.1995 8.09947C18.0156 9.18593 18.4996 10.5379 18.4996 12.0001C18.4996 13.3127 18.1094 14.5372 17.4385 15.5604C17.1357 16.0222 16.5158 16.1511 16.0539 15.8483C15.5921 15.5455 15.4632 14.9255 15.766 14.4637C16.2298 13.7564 16.4996 12.9113 16.4996 12.0001C16.4996 10.9859 16.1653 10.0526 15.6004 9.30063C15.2687 8.85905 15.3578 8.23218 15.7994 7.90049Z" fill="currentColor" />
        </svg>
    `

    static CC_DELETE = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
    `
}

new ClientChat();