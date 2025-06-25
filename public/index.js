const fetchShortenUrl = async () => {
  try {
    const response = await fetch("/links");
    const links = await response.json();
    const urlBox = document.querySelector(".url-box");
    urlBox.innerHTML = ""

    const linksArray = Object.entries(links)
    linksArray.forEach(link => {
      const [shortCode, url] = link;
      const truncatedUrl = url.length >= 30 ? `${url.slice(0, 30)}...` : url;
      urlBox.insertAdjacentHTML(
        "beforeend",
        `<div class="shorten-url">
        <a href="/${shortCode}" target="_blank" rel="noopener noreferrer">${window.location.origin}/${shortCode}</a>
        <br/>
        <div>${truncatedUrl}</div>
      </div>`
      );
    });
  } catch (error) {
    console.error(error.message);
  }
};

document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    url: formData.get("url"),
    customUrl: formData.get("custom-url"),
  };

  try {
    const response = await fetch("/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      alert("Form submitted successfully");
      e.target.reset();
      fetchShortenUrl();
    } else {
      const errorMessage = await response.text();
      alert(errorMessage);
    }
    // const data = response.json();
  } catch (error) {
    console.error(error.message);
  }
});

fetchShortenUrl();
