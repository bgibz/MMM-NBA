/* global Module */

/* Magic Mirror
 * Module: MMM-NBA
 *
 * By bgibz
 * Adapted from MMM-NHL by fewieden https://github.com/fewieden/MMM-NHL
 * MIT Licensed.
 */

Module.register("MMM-NBA", {
  modes: {
    1: "Pre-Season",
    2: "Regular-Season",
    3: "Playoffs"
  },

  details: {
    y: new Date().getFullYear(),
    t: "01"
  },

  states: {
    1: "1ST_QTR",
    2: "2ND_QTR",
    3: "3RD_QTR",
    4: "4TH_QTR",
    OT: "OT",
    OT2: "OT2",
    OT3: "OT3",
    FINAL: "FINAL",
    "FINAL OT": "FINAL_OVERTIME"
  },

  teams: {
    ATL: "ATL",
    BOS: "BOS",
    BKN: "BKN",
    CHA: "CHA",
    CHI: "CHI",
    CLE: "CLE",
    DAL: "DAL",
    DEN: "DEN",
    DET: "DET",
    GSW: "GSW",
    HOU: "HOU",
    IND: "IND",
    LAC: "LAC",
    LAL: "LAL",
    MEM: "MEM",
    MIA: "MIA",
    MIL: "MIL",
    MIN: "MIN",
    NOP: "NOP",
    NYK: "NYK",
    OKC: "OKC",
    ORL: "ORL",
    PHI: "PHI",
    PHX: "PHX",
    POR: "POR",
    SAC: "SAC",
    SAS: "SAS",
    TOR: "TOR",
    UTA: "UTA",
    WAS: "WAS"
  },

  rotateIndex: 0,
  rotateInterval: null,

  defaults: {
    focus_on: false,
    games: 6,
    format: "ddd h:mm",
    rotateInterval: 20 * 1000, // every 20 seconds
    reloadInterval: 5 * 60 * 1000 // every 5 minutes
  },

  requiresVersion: "2.1.0", // Required version of MagicMirror

  start: function() {
    Log.info(`Starting module: ${this.name}`);
    this.sendSocketNotification("CONFIG", {
      config: this.config,
      teams: this.teams
    });
    moment.locale(config.language);
  },

  /* scheduleUpdate()
   * Schedule next update.
   *
   * argument delay number - Milliseconds before next update.
   *  If empty, this.config.updateInterval is used.
   */
  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval;
    if (typeof delay !== "undefined" && delay >= 0) {
      nextLoad = delay;
    }
    nextLoad = nextLoad;
    var self = this;
    setTimeout(function() {
      self.getData();
    }, nextLoad);
  },

  setRotateInterval: function() {
    if (!this.rotateInterval && this.game_scores.length > this.config.games) {
      this.rotateInterval = setInterval(() => {
        if (this.rotateIndex + this.config.games >= this.game_scores.length) {
          this.rotateIndex = 0;
        } else {
          this.rotateIndex = this.rotateIndex + this.config.games;
        }
        this.updateDom(300);
      }, this.config.rotateInterval);
    } else if (this.game_scores.length <= this.config.games) {
      clearInterval(this.rotateInterval);
      this.rotateIndex = 0;
    }
    this.updateDom(300);
  },

  getDom: function() {
    const wrapper = document.createElement("div");
    const scores = document.createElement("div");
    const header = document.createElement("header");
    header.innerHTML = `NHL ${this.modes[this.details.t]} ${this.details.y}`;
    scores.appendChild(header);

    if (!this.game_scores) {
      const text = document.createElement("div");
      text.innerHTML = this.translate("LOADING");
      text.classList.add("dimmed", "light");
      scores.appendChild(text);
    } else {
      const table = document.createElement("table");
      table.classList.add("small", "table");

      table.appendChild(this.createLabelRow());

      const max = Math.min(
        this.rotateIndex + this.config.games,
        this.game_scores.length
      );
      for (let i = this.rotateIndex; i < max; i += 1) {
        this.appendDataRow(this.game_scores[i], table);
      }

      scores.appendChild(table);
    }

    wrapper.appendChild(scores);

    return wrapper;
  },

  createLabelRow() {
    const labelRow = document.createElement("tr");

    const dateLabel = document.createElement("th");
    const dateIcon = document.createElement("i");
    dateIcon.classList.add("fa", "fa-calendar");
    dateLabel.appendChild(dateIcon);
    labelRow.appendChild(dateLabel);

    const homeLabel = document.createElement("th");
    homeLabel.innerHTML = this.translate("HOME");
    homeLabel.setAttribute("colspan", 3);
    labelRow.appendChild(homeLabel);

    const vsLabel = document.createElement("th");
    vsLabel.innerHTML = "";
    labelRow.appendChild(vsLabel);

    const awayLabel = document.createElement("th");
    awayLabel.innerHTML = this.translate("AWAY");
    awayLabel.setAttribute("colspan", 3);
    labelRow.appendChild(awayLabel);

    return labelRow;
  },

  appendDataRow(data, appendTo) {
    const row = document.createElement("tr");
    row.classList.add("row");

    const date = document.createElement("td");
    if (data.statusNum === 2) {
      if (data.period.current === 0) {
        date.innerHTML = this.translate("PRE_GAME");
        date.classList.add("dimmed");
      } else if ([1, 2, 3, 4].includes(data.period.current)) {
        const third = document.createElement("div");
        third.innerHTML = this.translate(this.states[data.period.current]);
        if (data.clock !== "") {
          third.classList.add("live");
          date.appendChild(third);
          const time = document.createElement("div");
          time.classList.add("live");
          time.innerHTML = `${data.clock} ${this.translate("TIME_LEFT")}`;
          date.appendChild(time);
        } else {
          date.appendChild(third);
        }
      }
    } else if (
      data.statusNum === 1 &&
      Object.prototype.hasOwnProperty.call(data, "starttime")
    ) {
      // If pre-game display start time
      date.innerHTML = moment(data.starttime).local().format(this.config.);
    } else if (data.statusNum === 3) {
      // If game is over display "Final"
      date.innerHTML = this.translate(this.states[FINAL]);
      date.classList.add("dimmed");
    } else {
      date.innerHTML = this.translate("UNKNOWN");
      date.classList.add("dimmed");
    }
    row.appendChild(date);

    const homeTeam = document.createElement("td");
    homeTeam.classList.add("align-right");
    const homeTeamSpan = document.createElement("span");
    homeTeamSpan.innerHTML = this.teams[data.hTeam.triCode];
    homeTeam.appendChild(homeTeamSpan);
    row.appendChild(homeTeam);

    const homeLogo = document.createElement("td");
    const homeIcon = document.createElement("img");
    homeIcon.src = this.file(`icons/${this.teams[data.hTeam.triCode]}.png`);
    if (!this.config.colored) {
      homeIcon.classList.add("icon");
    }
    homeLogo.appendChild(homeIcon);
    row.appendChild(homeLogo);

    const homeScore = document.createElement("td");
    homeScore.innerHTML = data.hTeam.score === "" ? 0 : data.hTeam.score;
    row.appendChild(homeScore);

    const vs = document.createElement("td");
    vs.innerHTML = ":";
    row.appendChild(vs);

    const awayScore = document.createElement("td");
    awayScore.innerHTML = data.vTeam.score === "" ? 0 : data.vTeam.score;
    row.appendChild(awayScore);

    const awayLogo = document.createElement("td");
    const awayIcon = document.createElement("img");
    awayIcon.src = this.file(`icons/${this.teams[data.vTeam.triCode]}.png`);
    if (!this.config.colored) {
      awayIcon.classList.add("icon");
    }
    awayLogo.appendChild(awayIcon);
    row.appendChild(awayLogo);

    const awayTeam = document.createElement("td");
    awayTeam.classList.add("align-left");
    const awayTeamSpan = document.createElement("span");
    awayTeamSpan.innerHTML = this.teams[data.vTeam.triCode];
    awayTeam.appendChild(awayTeamSpan);
    row.appendChild(awayTeam);

    appendTo.appendChild(row);
  },

  getScripts: function() {
    return ["moment.js"];
  },

  getStyles: function() {
    return ["MMM-NBA.css", "font-awesome.css"];
  },

  // Load translations files
  getTranslations: function() {
    return {
      en: "translations/en.json"
    };
  },

  processData: function(data) {
    var self = this;
    this.dataRequest = data;
    if (this.loaded === false) {
      self.updateDom(self.config.animationSpeed);
    }
    this.loaded = true;

    // send notification to helper
    this.sendSocketNotification("GET_NBA_SCORES", data);
  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function(notification, payload) {
    if (notification === "SCORES") {
      // set dataNotification
      //console.log("socketNotificationReceived")
      this.game_scores = payload.scores;
      this.details = payload.details;
      this.setRotateInterval();
    }
  }
});
