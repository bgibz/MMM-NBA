 /* Magic Mirror
   * Module: MMM-NBA
   *
   * By bgibz
   * 
   */

  Module.register("MMM-NBA", {

      // Module config defaults.
      defaults: {
          updateInterval: 60000, // every 2 minutes
          initialLoadDelay: 3505, // 0 seconds delay
          rotateInterval: 5 * 1000,
          games: 6,
          header: true,
          logo: false,
          colored: false,
          format: 'ddd h:mm'
      },

      getTranslations() {
          return {
              en: 'translations/en.json'
          };
      },

      // Define required scripts.
      getScripts: function() {
          return ["moment.js", "moment-timezone.js"];
      },

      getStyles: function() {
          return ["MMM-NBA.css"];
      },

      // Define start sequence.
      start: function() {
          Log.info("Starting module: " + this.name);
          this.sendSocketNotification('CONFIG', this.config);
          // Set locale.
          this.week = "";
          this.nba = {};
          this.today = "";
          this.activeItem = 0;
          this.rotateInterval = null;
          this.rotateIndex = 0;
          this.scheduleUpdate();
      },

      getDom: function() {

          var nbascores = this.nba;

          var wrapper = document.createElement("div");
          var results = document.createElement("div");
          wrapper.className = "wrapper";

          if (this.config.header === true) {
              var header = document.createElement("header");
              header.classList.add("header");
              if (this.config.logo === true) {
                  header.innerHTML = "<img class='emblem' src='modules/MMM-NBA/icons/nba.png'>   NBA Scores  " + moment().format('MM/DD/YYYY');
              } else {
                  header.innerHTML = "NBA Scores  " + moment().format('MM/DD/YYYY');
              }
              wrapper.appendChild(header);
          }

          if (Object.keys(this.nba).length === 0) { 
              const text = document.createElement('div');
              text.innerHTML = this.translate('LOADING');
              text.classList.add('dimmed', 'light');
              results.appendChild(text);
          } else {
              const table = document.createElement('table');
              table.classList.add('small', 'table');

              table.appendChild(this.createLabelRow());

              const max = Math.min(this.config.games, nbascores.length);
              for (let i = this.rotateIndex; i < max; i += 1) {
                  this.appendDataRow(this.nba[i], table);
              }

              results.appendChild(table);
          }

          wrapper.appendChild(results);
         

          return wrapper;

      },

      createLabelRow() {
          const labelRow = document.createElement('tr');

          const dateLabel = document.createElement('th');
          const dateIcon = document.createElement('i');
          dateIcon.classList.add('fa', 'fa-calendar');
          dateLabel.appendChild(dateIcon);
          labelRow.appendChild(dateLabel);

          const homeLabel = document.createElement('th');
          homeLabel.innerHTML = this.translate('HOME');
          homeLabel.setAttribute('colspan', 3);
          labelRow.appendChild(homeLabel);

          const vsLabel = document.createElement('th');
          vsLabel.innerHTML = '';
          labelRow.appendChild(vsLabel);

          const awayLabel = document.createElement('th');
          awayLabel.innerHTML = this.translate('AWAY');
          awayLabel.setAttribute('colspan', 3);
          labelRow.appendChild(awayLabel);

          return labelRow;
      },

      appendDataRow: function (data, appendTo) {
          const row = document.createElement('tr');
          row.classList.add('row');
          const date = document.createElement('td');
          if (data.period_time.game_status === "2") {
              if (data.period_time.period_value === 0) {
                  date.innerHTML = 'PRE_GAME';
                  date.classList.add('dimmed');
              } else if (["1", "2", "3", "4"].includes(data.period_time.period_value)) {
                  const qtr = document.createElement('div');
                  qtr.innerHTML = this.translate(`${data.period_time.period_value}`); // create translations?
                  if (data.period_time.game_clock !== "") {
                      qtr.classList.add('live');
                      date.appendChild(qtr);
                      const time = document.createElement('div');
                      time.classList.add('live');
                      time.innerHTML = `${data.period_time.game_clock}`;
                      date.appendChild(time);
                  } else {
                      date.appendChild(qtr);
                  }
              }
          } else if (data.period_time.game_status === "1") { // If pre-game display start time
              // TODO: Display start times in local time
              //var mom = moment().tz('America/New_York');
              //var year = data.date.slice(0, 4);
              //var month = data.date.slice(4, 6);
              //console.log()
              //var day = data.date.slice(6, 8);
              //mom.set('month', month);
              //mom.set('date', day);
              //mom.subtract(1, 'month');
              //var startTime = data.time;
              //mom.set('hour', startTime.split[0, 2]);
              //mom.set('minute', startTime.split[2, 4]);
              //mom.set('second', 0);
              //date.innerHTML = moment(mom).format(this.config.format);
              date.innerHTML = `${data.period_time.period_status}`;
              date.classList.add('dimmed');
          } else if (data.period_time.game_status === "3") { // If game is over display "Final"
              date.innerHTML = `${data.period_time.period_status}`;
              date.classList.add('dimmed');
          } else {
              date.innerHTML = 'UNKNOWN';
              date.classList.add('dimmed');
          }
          row.appendChild(date);

          const homeTeam = document.createElement('td');
          homeTeam.classList.add('align-right');
          const homeTeamSpan = document.createElement('span');
          homeTeamSpan.innerHTML = `${data.home.abbreviation}`;
          homeTeam.appendChild(homeTeamSpan);
          row.appendChild(homeTeam);

          const homeLogo = document.createElement('td');
          const homeIcon = document.createElement('img');
          homeIcon.src = this.file(`icons/${data.home.nickname}.png`);
          if (!this.config.colored) {
              homeIcon.classList.add('icon');
          }
          homeLogo.appendChild(homeIcon);
          row.appendChild(homeLogo);

          const homeScore = document.createElement('td');
          homeScore.innerHTML = `${data.home.score}`;
          row.appendChild(homeScore);

          const vs = document.createElement('td');
          vs.innerHTML = ':';
          row.appendChild(vs);

          const awayScore = document.createElement('td');
          awayScore.innerHTML = `${data.visitor.score}`
          row.appendChild(awayScore);

          const awayLogo = document.createElement('td');
          const awayIcon = document.createElement('img');
          awayIcon.src = this.file(`icons/${data.visitor.nickname}.png`);
          if (!this.config.colored) {
              awayIcon.classList.add('icon');
          }
          awayLogo.appendChild(awayIcon);
          row.appendChild(awayLogo);

          const awayTeam = document.createElement('td');
          awayTeam.classList.add('align-left');
          const awayTeamSpan = document.createElement('span');
          awayTeamSpan.innerHTML = `${data.visitor.abbreviation}`;
          awayTeam.appendChild(awayTeamSpan);
          row.appendChild(awayTeam);

          appendTo.appendChild(row);
      },

      processNBA: function(data) {
          this.nba = data.game;
          this.loaded = true;
      },

      setRotateInterval() {
          if (!this.rotateInterval && this.nba.length > this.config.games) {
              this.rotateInterval = setInterval(() => {
                  if (this.rotateIndex + this.config.games >= this.nba.length) {
                      this.rotateIndex = 0;
                  } else {
                      this.rotateIndex = this.rotateIndex + this.config.matches;
                  }
                  this.updateDom(300);
              }, this.config.rotateInterval);
          } else if (this.nba.length <= this.config.matches) {
              clearInterval(this.rotateInterval);
              this.rotateIndex = 0;
          }
          this.updateDom(300);
      },

      scheduleUpdate: function() {
          setInterval(() => {
              this.getNBA();
          }, this.config.updateInterval);
          this.getNBA(this.config.initialLoadDelay);
      },

      getNBA: function () {
          this.sendSocketNotification('GET_NBA');
      },

      socketNotificationReceived: function(notification, payload) {
          if (notification === 'NBA_RESULTS') {
              this.processNBA(payload);
              if (this.rotateInterval == null) {
                  this.setRotateInterval();
              }
          }
      },
  });
