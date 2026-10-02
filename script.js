// ============================================================
// Google Apps Script Web App URL
// ============================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbyHDGumme_xEg5VmMT97oOCyRbe7NS11q4FqOKYr5tizeipTFi1wCrNGctw1MltAHvVoA/exec";


// ============================================================
// Basic helpers
// ============================================================

const $ = (id) => document.getElementById(id);

function show(element) {
  element.classList.remove("hidden");
}

function hide(element) {
  element.classList.add("hidden");
}

function setError(element, message) {
  element.textContent = message || "";
}


// ============================================================
// Determine whether this URL is a poll page
// Example:
// index.html?id=abc123
// ============================================================

const params = new URLSearchParams(window.location.search);
const pollId = params.get("id");


// ============================================================
// CREATE PAGE
// ============================================================

const createPage = $("createPage");
const pollPage = $("pollPage");
const loading = $("loading");

const questionInput = $("question");
const optionInputs = $("optionInputs");
const addOptionButton = $("addOption");
const createButton = $("createPoll");
const createError = $("createError");

const createdBox = $("createdBox");
const pollLinkInput = $("pollLink");
const copyLinkButton = $("copyLink");
const openPollLink = $("openPoll");

let optionCount = 0;


// Add one option input
function addOption(value = "") {
  optionCount++;

  const row = document.createElement("div");
  row.className = "option-input-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `选项 ${optionCount}`;
  input.maxLength = 300;
  input.value = value;
  input.className = "option-input";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-option";
  remove.textContent = "×";
  remove.title = "删除这个选项";

  remove.addEventListener("click", () => {
    row.remove();
    renumberOptions();
  });

  row.appendChild(input);
  row.appendChild(remove);

  optionInputs.appendChild(row);
}


// Renumber placeholders after deletion
function renumberOptions() {
  const rows =
    optionInputs.querySelectorAll(".option-input-row");

  rows.forEach((row, index) => {
    const input = row.querySelector("input");
    input.placeholder = `选项 ${index + 1}`;
  });

  optionCount = rows.length;
}


if (!pollId) {

  // Default options
  addOption();
  addOption();

  addOptionButton.addEventListener("click", () => {

    if (optionInputs.children.length >= 20) {
      setError(createError, "最多只能有 20 个选项。");
      return;
    }

    setError(createError, "");
    addOption();

  });


  createButton.addEventListener("click", createPoll);


  async function createPoll() {

    setError(createError, "");
    hide(createdBox);

    const question =
      questionInput.value.trim();

    const inputs =
      Array.from(
        optionInputs.querySelectorAll(".option-input")
      );

    const options =
      inputs
        .map(input => input.value.trim())
        .filter(Boolean);


    if (!question) {
      setError(createError, "请填写投票问题。");
      questionInput.focus();
      return;
    }


    if (options.length < 2) {
      setError(createError, "至少需要两个选项。");
      return;
    }


    if (options.length > 20) {
      setError(createError, "最多只能有 20 个选项。");
      return;
    }


    const normalized =
      options.map(text => text.toLowerCase());

    if (
      new Set(normalized).size !== options.length
    ) {
      setError(createError, "不能有重复的选项。");
      return;
    }


    createButton.disabled = true;
    createButton.textContent = "正在创建……";


    try {

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "create",
          question: question,
          options: options
        })
      });


      const data = await response.json();


      if (!data.success) {
        throw new Error(data.error || "创建失败。");
      }


      const newPollId =
        data.poll.pollId;


      const baseUrl =
        window.location.origin +
        window.location.pathname;


      const newUrl =
        baseUrl +
        "?id=" +
        encodeURIComponent(newPollId);


      pollLinkInput.value = newUrl;
      openPollLink.href = newUrl;

      show(createdBox);

    } catch (error) {

      setError(
        createError,
        "创建失败：" + error.message
      );

    } finally {

      createButton.disabled = false;
      createButton.textContent = "生成投票链接";

    }

  }


  copyLinkButton.addEventListener("click", async () => {

    try {

      await navigator.clipboard.writeText(
        pollLinkInput.value
      );

      copyLinkButton.textContent = "已复制";

      setTimeout(() => {
        copyLinkButton.textContent = "复制";
      }, 1500);

    } catch (error) {

      pollLinkInput.select();
      document.execCommand("copy");

      copyLinkButton.textContent = "已复制";

      setTimeout(() => {
        copyLinkButton.textContent = "复制";
      }, 1500);

    }

  });


// ============================================================
// POLL PAGE
// ============================================================

} else {

  hide(createPage);
  show(loading);

  loadPoll();


  async function loadPoll() {

    try {

      const response =
        await fetch(
          API_URL +
          "?pollId=" +
          encodeURIComponent(pollId)
        );


      const data =
        await response.json();


      if (!data.success) {
        throw new Error(
          data.error || "无法加载投票。"
        );
      }


      renderPoll(data.poll);

    } catch (error) {

      hide(loading);

      const errorCard =
        document.createElement("section");

      errorCard.className = "card";

      errorCard.innerHTML = `
        <h1>无法加载投票</h1>
        <p class="error">${escapeHtml(error.message)}</p>
      `;

      document
        .querySelector(".container")
        .appendChild(errorCard);

    }

  }


  function renderPoll(poll) {

    hide(loading);
    show(pollPage);

    $("pollQuestion").textContent =
      poll.question;


    $("pollHint").textContent =
      "请选择一个选项";


    const container =
      $("pollOptions");

    container.innerHTML = "";


    poll.options.forEach(option => {

      const label =
        document.createElement("label");

      label.className = "poll-option";


      const input =
        document.createElement("input");

      input.type = "radio";
      input.name = "pollOption";
      input.value = option.id;


      const text =
        document.createElement("span");

      text.textContent =
        option.text;


      label.appendChild(input);
      label.appendChild(text);

      container.appendChild(label);

    });


    $("pollForm")
      .addEventListener(
        "submit",
        (event) => submitVote(event, poll)
      );

  }


  async function submitVote(event, poll) {

    event.preventDefault();

    setError($("voteError"), "");


    const selected =
      document.querySelector(
        'input[name="pollOption"]:checked'
      );


    if (!selected) {

      setError(
        $("voteError"),
        "请选择一个选项。"
      );

      return;
    }


    const button =
      $("voteButton");

    button.disabled = true;
    button.textContent = "正在提交……";


    try {

      const response =
        await fetch(API_URL, {

          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body: JSON.stringify({

            action: "vote",

            pollId: poll.pollId,

            optionId: selected.value

          })

        });


      const data =
        await response.json();


      if (!data.success) {

        throw new Error(
          data.error || "投票失败。"
        );

      }


      // Prevent another vote in this browser
      localStorage.setItem(
        "voted_" + poll.pollId,
        "true"
      );


      showResults(
        data.results
      );


      // Disable voting controls
      document
        .querySelectorAll(
          'input[name="pollOption"]'
        )
        .forEach(input => {
          input.disabled = true;
        });


      button.disabled = true;
      button.textContent = "已提交";

    } catch (error) {

      setError(
        $("voteError"),
        "提交失败：" + error.message
      );

      button.disabled = false;
      button.textContent = "提交投票";

    }

  }


  function showResults(results) {

    show($("results"));


    $("totalVotes").textContent =
      `共 ${results.totalVotes} 人投票`;


    const list =
      $("resultList");

    list.innerHTML = "";


    results.options.forEach(option => {

      const row =
        document.createElement("div");

      row.className = "result-row";


      const header =
        document.createElement("div");

      header.className = "result-header";


      const name =
        document.createElement("span");

      name.textContent =
        option.text;


      const number =
        document.createElement("span");

      number.textContent =
        `${option.count} 人 · ${option.percentage}%`;


      header.appendChild(name);
      header.appendChild(number);


      const bar =
        document.createElement("div");

      bar.className = "bar";


      const fill =
        document.createElement("div");

      fill.className = "bar-fill";

      fill.style.width =
        `${option.percentage}%`;


      bar.appendChild(fill);


      row.appendChild(header);
      row.appendChild(bar);


      list.appendChild(row);

    });

  }

}


// ============================================================
// Escape HTML
// ============================================================

function escapeHtml(text) {

  const div =
    document.createElement("div");

  div.textContent =
    String(text);

  return div.innerHTML;

}
