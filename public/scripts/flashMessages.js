setTimeout(() => {
  const successes = document.querySelectorAll(".flash-success");
  if (successes.length > 0) {
    successes.forEach((success) => {
      success.style.display = "none";
    });
  }

  const errors = document.querySelectorAll(".flash-error");
  if (errors.length > 0) {
    errors.forEach((error) => {
      error.style.display = "none";
    });
  }
}, 5000);
