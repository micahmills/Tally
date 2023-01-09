import { LitElement, html, css } from 'lit';
import { until } from 'lit/directives/until.js';

export class TallyApp extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      apiURL: { type: String },
      SUPABASE_KEY: { type: String },
      _goals: { type: Array, state: true },
      _goalTallies: { type: Object, state: true },
      _timeFrame: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: #1a2b42;
        max-width: 960px;
        margin: 0 auto;
        text-align: center;
        background-color: var(--tally-app-background-color);
      }

      main {
        flex-grow: 1;
      }

      .logo {
        margin-top: 36px;
        animation: app-logo-spin infinite 20s linear;
      }

      @keyframes app-logo-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .app-footer {
        font-size: calc(12px + 0.5vmin);
        align-items: center;
      }

      .app-footer a {
        margin-left: 5px;
      }
    `;
  }

  constructor() {
    super();
    this.title = 'My app';
    this.apiURL = 'https://imefhvfbqpupdzvvmimc.supabase.co/rest/v1/';
    this.SUPABASE_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZWZodmZicXB1cGR6dnZtaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzIyMDMxMjEsImV4cCI6MTk4Nzc3OTEyMX0.PP0CaGNZxuqoFpj3zaSLHbdetXQgNm3qmgfc4l-HczA';

    this.apiCall('Goals', 'select=*')
      .then(goals => {
        this._goals = goals;
        this._goalData(goals);
      })
      .catch(error => error.message);
  }

  connectedCallback() {
    super.connectedCallback();
    this._timeFrame = new Date().getFullYear();
  }

  async apiCall(table, selectStatment) {
    const myHeaders = new Headers();
    myHeaders.append(
      'apikey',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZWZodmZicXB1cGR6dnZtaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzIyMDMxMjEsImV4cCI6MTk4Nzc3OTEyMX0.PP0CaGNZxuqoFpj3zaSLHbdetXQgNm3qmgfc4l-HczA'
    );
    myHeaders.append(
      'Authorization',
      `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZWZodmZicXB1cGR6dnZtaW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzIyMDMxMjEsImV4cCI6MTk4Nzc3OTEyMX0.PP0CaGNZxuqoFpj3zaSLHbdetXQgNm3qmgfc4l-HczA`
    );

    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };

    const response = await fetch(
      `${this.apiURL}${table}?${selectStatment}`,
      requestOptions
    );

    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();
    return data;
  }

  _changeTimeFrame(event) {
    this._timeFrame += parseInt(event.target.value, 10);
  }

  _goalData(goals) {
    const tallies = {};
    goals.forEach(goal => {
      this.apiCall('goalCountList', `goalID=eq.${goal.id}&select=*`)
        .then(goalTallies => {
          tallies[`goal_${goal.id}`] = goalTallies;
          this._goalTallies = tallies;
          this.requestUpdate();
        })
        .catch(error => error.message);
    });
  }

  _goalTallyCount(goal, timeframe) {
    const dateMax = new Date(`01/01/${timeframe + 1}`).getTime();
    const dateMin = new Date(`01/01/${timeframe}`).getTime();
    const goalID = `goal_${goal}`;
    let tally = [];
    if (this._goalTallies[goalID]) {
      tally = this._goalTallies[goalID].filter(item => {
        if (
          new Date(item.timeStamp).getTime() <= dateMax &&
          new Date(item.timeStamp).getTime() >= dateMin
        ) {
          return item;
        }
        return false;
      });
    }
    const count = tally.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0
    );

    return count;
  }

  render() {
    return html`
      <main>
        ${until(
          this._goalTallies
            ? this._goals.map(
                goal => html`
                  <div .style="background: ${goal.color}">
                    <button @click=${this._changeTimeFrame} value="-1">
                      &#8249;
                    </button>
                    <span class="goalName">${goal.name}</span>
                    <span class="goalYear">${this._timeFrame}</span>
                    <span class="goalCount"
                      >${this._goalTallyCount(goal.id, this._timeFrame)}</span
                    >
                    <button @click=${this._changeTimeFrame} value="1">
                      &#8250;
                    </button>
                  </div>
                `
              )
            : '',
          html`<span>Loading...</span>`
        )}
      </main>
    `;
  }
}
