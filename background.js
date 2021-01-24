
function copyTextToClipboard(text) {
  //Create a textbox field where we can insert text to. 
  var copyFrom = document.createElement("textarea");

  //Set the text content to be the text you wished to copy.
  copyFrom.textContent = text;

  //Append the textbox field into the body as a child. 
  //"execCommand()" only works when there exists selected text, and the text is inside 
  //document.body (meaning the text is part of a valid rendered HTML element).
  document.body.appendChild(copyFrom);

  //Select all the text!
  copyFrom.select();

  //Execute command
  document.execCommand('copy');

  //(Optional) De-select the text using blur(). 
  copyFrom.blur();

  //Remove the textbox field from the document.body, so no other JavaScript nor 
  //other elements can get access to this.
  document.body.removeChild(copyFrom);
}


function toISOStringLocal(d) {
  function z(n) { return (n < 10 ? '0' : '') + n }
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' +
    z(d.getDate()) + 'T' + z(d.getHours()) + ':' +
    z(d.getMinutes()) + ':' + z(d.getSeconds())
}

function getJustDate(date) {
  let ret = new Date(date)
  ret.setHours(0)
  ret.setMinutes(0)
  ret.setSeconds(0)
  ret.setMilliseconds(0)
  return ret
}

function datePrefix(readable) {
  var m = readable.getMonth();  // returns 6 (note that this number is one less than the number of the month in isoformat)
  var d = readable.getDate();  // returns 15
  var l = readable.getDay()
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  let mlong = months[m];
  let dlong = days[l]

  return (dlong + ", " + mlong + " " + d);
}

function getTiming(readable) {
  let date = new Date(readable)
  date.setFullYear(111)
  date.setMonth(0)
  date.setDate(0)
  date.setMilliseconds(0)
  return date
}
function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}


chrome.commands.onCommand.addListener(function (command) {
  let timeMin = ""
  let timeMax = ""
  let busy = []
  let freeTime = []
  chrome.identity.getAuthToken({ interactive: true }, async function (token) {
    let init = {
      method: 'GET',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      minAccessRole: "writer",
      'contentType': 'json'
    };
    var url = new URL("https://www.googleapis.com/calendar/v3/users/me/calendarList"),
    params = { minAccessRole: "writer", maxResults: 250}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    let calendars = []
    await fetch(
      url,
      init)
      .then((response) => response.json())
      .then(function (data) {
        timeMin = (toISOStringLocal(new Date())) + "-10:00";
        let someDate = new Date();
        let numberOfDaysToAdd = 5;
        someDate.setDate(someDate.getDate() + numberOfDaysToAdd)
        timeMax = (toISOStringLocal(someDate)) + "-10:00";
        data["items"].map(elem => {
          calendars.push({"id" : elem['id']})
        })
      });
    let initt = {
      method: 'POST',
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "timeMin": timeMin, "timeMax": timeMax, "items": calendars }),
      'contentType': 'json'
    };
    var urll = new URL("https://www.googleapis.com/calendar/v3/freeBusy");
    //   paramss = { timeMin: timeMin, timeMax: timeMax, items: calendars }
    // Object.keys(paramss).forEach(key => urll.searchParams.append(key, paramss[key]))
    await fetch(
      urll,
      initt)
      .then((response) => response.json())
      .then(function (data) {
        for (const [key, value] of Object.entries(data['calendars'])) {
          if (value['busy'].length > 0) {
            // busy.push(value['busy'])
            value["busy"].map(elem => {

              
              let start = parseISOString(elem['start'])
              let end = parseISOString(elem['end'])
              if (start.getDay() != 0 & start.getDay() != 6) {
                busy.push({ "start": start, "end": end });
              }
              
            })
          }
        }
      });
    busy.sort(function (a, b) {
      var c = new Date(a['start']);
      var d = new Date(b['start']);
      return c - d;
    })
    // define(function (require) {
    //   const freebusy$832 = require('.');
    // });

    let earliest = new Date()
    earliest.setHours(9)
    earliest.setMinutes(0)
    earliest.setSeconds(0)
    earliest.setMilliseconds(0)

    let latest = new Date()
    latest.setHours(18)
    latest.setMinutes(0)
    latest.setSeconds(0)
    latest.setMilliseconds(0)

    let j = 0
    let row = busy[j]
    let rangeStart = earliest
    let checker = true

    let timezone = new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2];
    let currentTime = new Date()
    let slot = 0
    if (currentTime > earliest) {
      rangeStart = currentTime
    }
    while (checker & slot < 7) {
      if (rangeStart.getDay() == 0 || rangeStart.getDay() == 6){
        earliest.setDate(rangeStart.getDate() + 1) // get tmrw 
        latest.setDate(rangeStart.getDate() + 1) // get tmrw 
        rangeStart = new Date(earliest)
      } else {
        while (datePrefix(row['start']) == datePrefix(rangeStart) & checker & slot < 7) {
          if (rangeStart < latest) {
            if ((row['start'] <= earliest) & (row['end'] > earliest)) {
              rangeStart = row['end']
            }
            if (row['start'] > latest) {
              row['start'] = latest
            }
            if ((row['start'] - rangeStart) >= 3600000) {
              freeTime.push(datePrefix(rangeStart) + ": " + rangeStart.toLocaleString([], { hour12: true, hour: '2-digit', minute: '2-digit' }) + " - " + row['start'].toLocaleString([], { hour12: true, hour: '2-digit', minute: '2-digit' }) + " " + timezone)
              slot = slot + 1
            }
          }
          rangeStart = row['end']
          j = j + 1
          if (j >= busy.length) {
            checker = false
          } else {
            row = busy[j]
          }
        }
        if ((latest - rangeStart) >= 3600000) {
          freeTime.push(datePrefix(rangeStart) + ": " + rangeStart.toLocaleString([], { hour12: true, hour: '2-digit', minute: '2-digit' }) + " - " + latest.toLocaleString([], { hour12: true, hour: '2-digit', minute: '2-digit' }) + " " + timezone)
          slot = slot + 1
        }
        earliest.setDate(rangeStart.getDate() + 1) // get tmrw 
        latest.setDate(rangeStart.getDate() + 1) // get tmrw 
        rangeStart = new Date(earliest)
      }
      }
    let information = []
    let text = "Would any of these times work for you? \n"
    information.push(text)
    for (let z = 0; z < freeTime.length - 1; z++){
      let elem = freeTime[z]
      text = text + "\t      • " + elem + "\n"
      information.push(elem)
    }


    copyTextToClipboard(text)


    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      // chrome.tabs.executeScript(tabs[0].id, { code: "var scriptOptions = { value:" + text + "}"}, function () {
      chrome.tabs.executeScript(tabs[0].id, {
        code: 'var data = ' + JSON.stringify(information)
      }, function () {
          chrome.tabs.executeScript(tabs[0].id, {
            file: "content.js"
          }, function () { })
       })

    });
  });



});

