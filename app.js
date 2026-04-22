const DISTANCE_TO_REACTION = new Map([
  [1, 50],
  [2, 60],
  [3, 70],
  [4, 80],
  [5, 90],
  [6, 100],
  [7, 120],
  [8, 130],
  [9, 140],
  [10, 140],
  [11, 150],
  [12, 160],
  [13, 160],
  [14, 170],
  [15, 170],
  [16, 180],
  [17, 190],
  [18, 190],
  [19, 200],
  [20, 200],
  [21, 210],
  [22, 210],
  [23, 220],
  [24, 220],
  [25, 230],
  [26, 230],
  [27, 230],
  [28, 240],
  [29, 240],
  [30, 250],
]);

const STORAGE_KEY = "rulerdrop-results-v1";
const MAX_STORED_RECORDS = 500;
const MIN_REACTION_TIME = 50;
const MAX_REACTION_TIME = 250;

const converterForm = document.getElementById("converterForm");
const ageInput = document.getElementById("ageInput");
const distanceInput = document.getElementById("distanceInput");
const resultValue = document.getElementById("resultValue");
const resultMeta = document.getElementById("resultMeta");
const reactionComment = document.getElementById("reactionComment");
const storeMessage = document.getElementById("storeMessage");
const errorMessage = document.getElementById("errorMessage");
const tableBody = document.getElementById("tableBody");
const clearBtn = document.getElementById("clearBtn");
const clearDataBtn = document.getElementById("clearDataBtn");
const barAge14 = document.getElementById("barAge14");
const barAge15 = document.getElementById("barAge15");
const barValue14 = document.getElementById("barValue14");
const barValue15 = document.getElementById("barValue15");
const barCount14 = document.getElementById("barCount14");
const barCount15 = document.getElementById("barCount15");
const chartDifference = document.getElementById("chartDifference");

let savedRecords = loadSavedRecords();

function renderTable() {
  tableBody.innerHTML = "";

  for (let leftDistance = 1; leftDistance <= 15; leftDistance += 1) {
    const rightDistance = leftDistance + 15;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${leftDistance}</td>
      <td>${DISTANCE_TO_REACTION.get(leftDistance)}</td>
      <td>${rightDistance}</td>
      <td>${DISTANCE_TO_REACTION.get(rightDistance)}</td>
    `;

    tableBody.appendChild(row);
  }
}

function convertDistance(distance) {
  if (!Number.isFinite(distance)) {
    return { error: "Please enter a valid number." };
  }

  if (distance < 1 || distance > 30) {
    return { error: "Distance must be between 1 cm and 30 cm." };
  }

  if (Number.isInteger(distance)) {
    return {
      reactionTime: DISTANCE_TO_REACTION.get(distance),
      message: `Exact lookup from the table at ${distance} cm.`,
    };
  }

  const lowerDistance = Math.floor(distance);
  const upperDistance = Math.ceil(distance);
  const lowerTime = DISTANCE_TO_REACTION.get(lowerDistance);
  const upperTime = DISTANCE_TO_REACTION.get(upperDistance);

  // Estimate in-between values by interpolating the two nearest table entries.
  const distanceFraction = distance - lowerDistance;
  const estimatedTime = Math.round(
    lowerTime + (upperTime - lowerTime) * distanceFraction,
  );

  return {
    reactionTime: estimatedTime,
    message: `Estimated between ${lowerDistance} cm (${lowerTime} ms) and ${upperDistance} cm (${upperTime} ms).`,
  };
}

function clearError() {
  errorMessage.textContent = "";
}

function clearStoreMessage() {
  storeMessage.textContent = "";
}

function resetResultDisplay() {
  resultValue.textContent = "-- ms";
  resultMeta.textContent = "Enter a distance and press Convert.";
  reactionComment.classList.remove("comment-pop");
  reactionComment.textContent = "Convert a distance to see your performance comment.";
}

function getPerformanceComment(reactionTime) {
  if (reactionTime <= 90) {
    return "A clairvoyant catcher... are you cheating?!";
  }

  if (reactionTime <= 120) {
    return "Impressive, do you play computer games? Next stop, F16 fighter planes!";
  }

  if (reactionTime <= 150) {
    return "Well done, are you a text messager?";
  }

  if (reactionTime <= 180) {
    return "Not bad - but you're just Joe Average.";
  }

  if (reactionTime <= 210) {
    return "Keep trying, you're not top gun yet!";
  }

  if (reactionTime <= 230) {
    return "You'd get faster if it were money instead of a ruler!";
  }

  return "...ouch! Did the ruler hit your foot? Keep trying!";
}

function showPerformanceComment(reactionTime) {
  reactionComment.textContent = getPerformanceComment(reactionTime);
  reactionComment.classList.remove("comment-pop");

  // Restart keyframe animation when the comment text updates.
  void reactionComment.offsetWidth;
  reactionComment.classList.add("comment-pop");
}

function isSupportedAge(value) {
  return value === "14" || value === "15";
}

function loadSavedRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => {
      return (
        item &&
        Number.isFinite(item.distance) &&
        Number.isFinite(item.reactionTime) &&
        Number.isFinite(item.age)
      );
    });
  } catch {
    return [];
  }
}

function persistSavedRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRecords));
}

function pluralizeEntries(count) {
  return `${count} ${count === 1 ? "entry" : "entries"}`;
}

function getAgeStats(age) {
  const matches = savedRecords.filter((record) => record.age === age);
  const count = matches.length;

  if (count === 0) {
    return { count: 0, average: 0 };
  }

  const total = matches.reduce((sum, record) => sum + record.reactionTime, 0);

  return {
    count,
    average: Math.round(total / count),
  };
}

function toChartHeightPercent(reactionTime) {
  const clampedTime = Math.min(
    MAX_REACTION_TIME,
    Math.max(MIN_REACTION_TIME, reactionTime),
  );
  const normalized =
    (clampedTime - MIN_REACTION_TIME) /
    (MAX_REACTION_TIME - MIN_REACTION_TIME);

  return Math.max(2, normalized * 100);
}

function renderAgeComparisonChart() {
  const age14 = getAgeStats(14);
  const age15 = getAgeStats(15);
  const height14 = age14.count ? toChartHeightPercent(age14.average) : 2;
  const height15 = age15.count ? toChartHeightPercent(age15.average) : 2;

  barAge14.style.height = `${height14}%`;
  barAge15.style.height = `${height15}%`;
  barAge14.classList.toggle("has-data", age14.count > 0);
  barAge15.classList.toggle("has-data", age15.count > 0);

  barValue14.textContent = age14.count ? `${age14.average} ms` : "No data";
  barValue15.textContent = age15.count ? `${age15.average} ms` : "No data";
  barCount14.textContent = pluralizeEntries(age14.count);
  barCount15.textContent = pluralizeEntries(age15.count);

  if (age14.count > 0 && age15.count > 0) {
    const diff = Math.abs(age14.average - age15.average);

    if (age14.average === age15.average) {
      chartDifference.textContent =
        "Both ages currently have the same average reaction time.";
      return;
    }

    const fasterAge = age14.average < age15.average ? "Age 14" : "Age 15";
    chartDifference.textContent = `${fasterAge} is faster by ${diff} ms on average.`;
    return;
  }

  if (age14.count > 0 || age15.count > 0) {
    chartDifference.textContent =
      "Save at least one result for both ages to compare differences.";
    return;
  }

  chartDifference.textContent = "Save some results to compare age groups.";
}

function saveRecord(age, distance, reactionTime) {
  savedRecords.push({
    age,
    distance: Number(distance.toFixed(1)),
    reactionTime,
    createdAt: new Date().toISOString(),
  });

  if (savedRecords.length > MAX_STORED_RECORDS) {
    savedRecords = savedRecords.slice(savedRecords.length - MAX_STORED_RECORDS);
  }

  persistSavedRecords();
  renderAgeComparisonChart();
}

function updateResult(options = {}) {
  const { shouldSave = false } = options;

  clearError();
  clearStoreMessage();

  const enteredDistance = Number.parseFloat(distanceInput.value);
  const conversion = convertDistance(enteredDistance);

  if (conversion.error) {
    resetResultDisplay();
    errorMessage.textContent = conversion.error;
    return false;
  }

  resultValue.textContent = `${conversion.reactionTime} ms`;
  resultMeta.textContent = conversion.message;
  showPerformanceComment(conversion.reactionTime);

  if (!shouldSave) {
    return true;
  }

  if (!isSupportedAge(ageInput.value)) {
    errorMessage.textContent = "Please select age 14 or 15 before saving.";
    return false;
  }

  saveRecord(Number.parseInt(ageInput.value, 10), enteredDistance, conversion.reactionTime);
  storeMessage.textContent = `Saved: age ${ageInput.value}, ${enteredDistance.toFixed(1)} cm, ${conversion.reactionTime} ms.`;
  return true;
}

converterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateResult({ shouldSave: true });
});

clearBtn.addEventListener("click", () => {
  converterForm.reset();
  clearError();
  clearStoreMessage();
  resetResultDisplay();
  distanceInput.focus();
});

clearDataBtn.addEventListener("click", () => {
  savedRecords = [];
  localStorage.removeItem(STORAGE_KEY);
  clearError();
  storeMessage.textContent = "Saved data was cleared.";
  renderAgeComparisonChart();
});

distanceInput.addEventListener("input", () => {
  if (distanceInput.value.trim() === "") {
    clearError();
    clearStoreMessage();
    resetResultDisplay();
    return;
  }

  updateResult();
});

renderTable();
renderAgeComparisonChart();
