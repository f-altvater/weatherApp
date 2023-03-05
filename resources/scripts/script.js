const input = document.getElementById('search-bar');
const optionsContainer = document.querySelector('.search-options');
let prevSuggestions = document.getElementsByClassName('search-suggestions');
const dayCards = document.getElementsByClassName('day-card');

let notTrackedKeys = ['Control', 'Shift', ' ', 'CapsLock', 'Tab', 'Alt', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'ArrowLeft', 'ArrowRight'];
let arrowKeysTracked = ['ArrowDown', 'ArrowUp'];

let options = [];
let n = 0;

let data;
let region;

function userPosition() {

    navigator.geolocation.getCurrentPosition(userLatLong);

}

function userLatLong(position) {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;

    displayData(0, 0);

    userRegion(lat, long);
}

async function userRegion(lat, long) {

    let city;

    await fetch(`https://geocode.maps.co/reverse?lat=${lat}&lon=${long}`)
    .then(response => response.json())
    .then(response => {
        city = response.address.city;
    })
    .catch(err => console.log(err));

    region = city;

    userRegionWeather(lat, long, city);

}

async function userRegionWeather(lat, long, city) {

    await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&timezone=auto&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,precipitation_probability_mean,sunrise,sunset,windspeed_10m_max,windspeed_10m_min,winddirection_10m_dominant,uv_index_max,weathercode`)
    .then(response => response.json())
    .then(response => {
        data = response;
    })
    .catch(err => console.log(err));
    
    displayData(data, city);

}

async function searchSuggestions() {
    let inputValue = input.value.toLowerCase();
    const inputArray = inputValue.split(' ');
    const queryInput = inputArray.join('+');
    const numOfPrevSuggestions = prevSuggestions.length;

    if(numOfPrevSuggestions !== 0) {
        options = [];
    }

    let suggestions = [];
    
    await fetch(`https://geocode.maps.co/search?q=${queryInput}`)
    .then(response => response.json())
    .then(response => {
        response.forEach((result) => {
            options.push({
                name: result.display_name,
                long: result.lon,
                lat: result.lat
            });
        });

        if(options.length > 0){
            optionsContainer.innerHTML = '';
            for(let i = 0; i < 5; i++) {
                suggestions.push(document.createElement('p'));
                suggestions[i].classList.add(`search-suggestions`);
                suggestions[i].classList.add(`${i}`);
                const value = options[i].name;
                suggestions[i].textContent = value;
                suggestions[i].addEventListener('click', selectRegion);
                optionsContainer.appendChild(suggestions[i]);
            }
        }
    })
    .catch(err => console.error(err));

    if(suggestions.length > 0) {
        optionsContainer.style.display = 'flex';
        optionsContainer.style.zIndex = '90';
    } else {
        optionsContainer.style.display = 'none';
        optionsContainer.style.zIndex = '0';
    }

    prevSuggestions = document.getElementsByClassName('search-suggestions');

    n--;
}

async function selectRegion(e) {
    let option = e.target.classList[1];

    let name = options[option].name;
    let lat = options[option].lat;
    let long = options[option].long;
    
    await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&timezone=auto&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,precipitation_probability_mean,sunrise,sunset,windspeed_10m_max,windspeed_10m_min,winddirection_10m_dominant,uv_index_max,weathercode`)
    .then(response => response.json())
    .then(response => {
        data = response;
    })
    .catch(err => console.log(err));
    
    optionsContainer.style.display = 'none';

    const nameArr = name.split(', ');
    const firstAndLastIndexOfArr = [nameArr[0], nameArr[nameArr.length - 1]];

    region = firstAndLastIndexOfArr.join(', ');

    displayData(data, region);

}

let shownDay = 0;

function displayData(data, region) {

    const regionName = document.querySelector('.region-name-container');
    //const weatherContainer = document.querySelector('.weather-container');

    const mainInfo = document.querySelector('.main-info');
    const mainDate = mainInfo.querySelector('.date');
    const mainWeathercode = mainInfo.querySelector('.weather-code-container');
    const mainWeathercodeTitle = mainWeathercode.querySelector('.weathercode-title');
    const mainWeatherIcon = mainWeathercode.querySelector('.weather-icon');
    const mainMaxTemp = mainInfo.querySelector('.maxTemp');
    const mainMinTemp = mainInfo.querySelector('.minTemp');

    const extraInfo = document.querySelector('.extra-info');
    const extraPrecipHours = extraInfo.querySelector('.precip-hours');
    const extraPrecipProb = extraInfo.querySelector('.precip-probability');
    const extraPrecipSum = extraInfo.querySelector('.precip-sum');
    const extraSunrise = extraInfo.querySelector('.sunrise');
    const extraSunset = extraInfo.querySelector('.sunset');
    const extraUV = extraInfo.querySelector('.max-uv-index');
    const extraWindDir = extraInfo.querySelector('.wind-direction');
    const extraWindMax = extraInfo.querySelector('.windspeed-max');
    const extraWindMin = extraInfo.querySelector('.windspeed-min');

    const accentSlides = [document.getElementById('day-weather-slide-one'), document.getElementById('day-weather-slide-two')];

    if(data === 0 && region === 0) {
        regionName.innerHTML = 'Loading...';

    } else {
        //storing accessed datas in their arrays for more clarification what is accessed from what element
        const dates = data.daily.time;
        const weathercodes = data.daily.weathercode;
        const maxTemps = data.daily.temperature_2m_max;
        const minTemps = data.daily.temperature_2m_min;
        const sunrises = data.daily.sunrise;
        const sunsets = data.daily.sunset;
        const precipitationHours = data.daily.precipitation_hours;
        const precipitationProbabilities = data.daily.precipitation_probability_mean;
        const precipitationSums = data.daily.precipitation_sum;
        const maxUV = data.daily.uv_index_max;
        const windspeedMax = data.daily.windspeed_10m_max;
        const windspeedMin = data.daily.windspeed_10m_min;
        const windDegreeDirection = data.daily.winddirection_10m_dominant;

        let sunriseHours = [];
        let sunsetHours = [];
        let weathercodeForHumans = weathercodeTranslator(weathercodes);
        let dayNames = datesToNames(dates);
        let windCardinalDirection = windDegreeToCardinal(windDegreeDirection);

        sunrises.forEach(date => {
            sunriseHours.push(date.slice(11));
        })

        sunsets.forEach(date => {
            sunsetHours.push(date.slice(11));
        })

        mainInfo.style.display = window.visualViewport.width > 1024 ? 'inline-block' : 'flex';

        regionName.innerHTML = region ? region : '';

        mainDate.innerHTML = dayNames[shownDay];

        mainWeathercodeTitle.innerHTML = weathercodeForHumans[shownDay];
        mainWeatherIcon.src = iconPicker(weathercodes[shownDay]);

        mainMaxTemp.innerHTML = maxTemps[shownDay] + '°C';
        mainMinTemp.innerHTML = minTemps[shownDay] + '°C';

        extraPrecipHours.innerHTML = 'Precipitation Hours: ' + precipitationHours[shownDay] + ' h';
        extraPrecipProb.innerHTML = 'Precipitation Probability: ' + precipitationProbabilities[shownDay] + '%';
        extraPrecipSum.innerHTML = 'Total Precipitaion: ' + precipitationSums[shownDay] + ' mm';

        extraSunrise.innerHTML = 'Sunrise: ' + sunriseHours[shownDay];
        extraSunset.innerHTML = 'Sunset: ' + sunsetHours[shownDay];
        extraUV.innerHTML = 'Max UV Index: ' + maxUV[shownDay];

        extraWindDir.innerHTML = 'Winddirection: ' + windDegreeDirection[shownDay] + '° / ' + windCardinalDirection[shownDay];
        extraWindMax.innerHTML = 'Max Windspeed: ' + windspeedMax[shownDay] + ' km/h';
        extraWindMin.innerHTML = 'Min Windspeed: ' + windspeedMin[shownDay] + ' km/h';

        styleCards(dayNames, minTemps, maxTemps, weathercodes);

        accentSlides.forEach(slide => {
            slide.style.backgroundColor = slideColorPicker(weathercodes[shownDay]);
        });

    }

}

function styleCards(dayArr, minTArr, maxTArr, weathercodeArr) {

    const cardsContainer = document.querySelector('.remaining-day-cards');

    const days = dayArr;
    const minTs = minTArr;
    const maxTs = maxTArr;
    const weathercodes = weathercodeArr;

    const cardDates = document.querySelectorAll('.card-date');
    const cardTMins = document.getElementsByClassName('minTempCard');
    const cardTMaxs = document.getElementsByClassName('maxTempCard');
    const cardWeathercodeTitles = document.querySelectorAll('.card-weathercode-title');
    const cardWeatherIcons = document.querySelectorAll('.card-weather-icon');

    let weathercodeForHumans = weathercodeTranslator(weathercodes);

    if(shownDay === 0) {
        for(let i = 0; i < 4; i++) {

            cardDates[i].innerHTML = days[i+1];
            cardTMins[i].innerHTML = minTs[i+1] + '°C';
            cardTMaxs[i].innerHTML = maxTs[i+1] + '°C';
            cardWeathercodeTitles[i].innerHTML = weathercodeForHumans[i+1];
            cardWeatherIcons[i].src = iconPicker(weathercodes[i+1]);

        }

    } else if(shownDay === 1) {
        cardDates[0].innerHTML = days[0];
        cardTMins[0].innerHTML = minTs[0] + '°C';
        cardTMaxs[0].innerHTML = maxTs[0] + '°C';
        cardWeathercodeTitles[0].innerHTML = weathercodeForHumans[0];
        cardWeatherIcons[0].src = iconPicker(weathercodes[0]);

        for(let i = 1; i < 4; i++) {

            cardDates[i].innerHTML = days[i+1];
            cardTMins[i].innerHTML = minTs[i+1] + '°C';
            cardTMaxs[i].innerHTML = maxTs[i+1] + '°C';
            cardWeathercodeTitles[i].innerHTML = weathercodeForHumans[i+1];
            cardWeatherIcons[i].src = iconPicker(weathercodes[i+1]);

        }

    } else if(shownDay === 2) {
        for(let i = 0; i < 4; i++) {

            if(i < 2) {
                cardDates[i].innerHTML = days[i];
                cardTMins[i].innerHTML = minTs[i] + '°C';
                cardTMaxs[i].innerHTML = maxTs[i] + '°C';
                cardWeathercodeTitles[i].innerHTML = weathercodeForHumans[i];
                cardWeatherIcons[i].src = iconPicker(weathercodes[i]);  
            
            } else {
                cardDates[i].innerHTML = days[i+1];
                cardTMins[i].innerHTML = minTs[i+1] + '°C';
                cardTMaxs[i].innerHTML = maxTs[i+1] + '°C';
                cardWeathercodeTitles[i].innerHTML = weathercodeForHumans[i+1];
                cardWeatherIcons[i].src = iconPicker(weathercodes[i+1]);

            }
            
        }
    } else if(shownDay === 3) {
        for(let i = 0; i < 3; i++) {

            cardDates[i].innerHTML = days[i];
            cardTMins[i].innerHTML = minTs[i] + '°C';
            cardTMaxs[i].innerHTML = maxTs[i] + '°C';
            cardWeathercodeTitles[i].innerHTML = weathercodeForHumans[i];
            cardWeatherIcons[i].src = iconPicker(weathercodes[i]);

        }

        cardDates[3].innerHTML = days[4];
        cardTMins[3].innerHTML = minTs[4] + '°C';
        cardTMaxs[3].innerHTML = maxTs[4] + '°C';
        cardWeathercodeTitles[3].innerHTML = weathercodeForHumans[4];
        cardWeatherIcons[3].src = iconPicker(weathercodes[4]);

    } else {
        for(let i = 0; i < 4; i++) {

            cardDates[i].innerHTML = days[i];
            cardTMins[i].innerHTML = minTs[i] + '°C';
            cardTMaxs[i].innerHTML = maxTs[i] + '°C';
            cardWeathercodeTitles[i].innerHTML = weathercodeForHumans[i];
            cardWeatherIcons[i].src = iconPicker(weathercodes[i]);

        }
    }

    cardsContainer.style.display = 'flex';

}

function slideColorPicker(weathercode) {

    const chooseSunny = [0, 1];
    const chooseCloudy = [2, 3, 51, 56, 45];
    const chooseRainy = [53, 55, 61, 63, 56, 66, 80, 81];
    const chooseSnowy = [48, 57, 67, 71, 73, 75, 77, 85, 86];
    const chooseThunderstorm = [82, 95, 96, 99, 65];

    if(chooseSunny.includes(weathercode)) return '#fc9601';
    else if(chooseCloudy.includes(weathercode)) return '#747484';
    else if(chooseRainy.includes(weathercode)) return '#42698c';
    else if(chooseSnowy.includes(weathercode)) return '#c0f6fb';
    else if(chooseThunderstorm.includes(weathercode)) return '#2f4651';
    else return 'transparent';

}

function iconPicker(weathercode) {

    const pickCloud = [3, 51];
    const pickSun = [0, 1];
    const pickPartCloud = [2];
    const pickLightRain = [51, 53, 56, 61];
    const pickRain = [55, 57, 63, 80];
    const pickHeavyRain = [65, 67, 81, 82];
    const pickSnow = [71, 73, 75, 77, 85, 86];
    const pickStorm = [95, 96, 99];
    const pickFog = [45, 48];

    let src;
    const pre = 'resources/images/large/';

    if(pickCloud.includes(weathercode)){
        src = pre + 'cloud100.png';

    } else if(pickSun.includes(weathercode)){
        src = pre + 'sun100.png';

    } else if(pickPartCloud.includes(weathercode)){
        src = pre + 'partCloud100.png';

    } else if(pickLightRain.includes(weathercode)){
        src = pre + 'lightRain100.png';

    } else if(pickRain.includes(weathercode)){
        src = pre + 'rain100.png';

    } else if(pickHeavyRain.includes(weathercode)){
        src = pre + 'heavyRain100.png';

    } else if(pickSnow.includes(weathercode)){
        src = pre + 'snow100.png';

    } else if(pickStorm.includes(weathercode)){
        src = pre + 'storm100.png';

    } else if(pickFog.includes(weathercode)){
        src = pre + 'fog100.png';

    }

    return src;

}


function weathercodeTranslator(weathercodeArr) {

    let readableWeatherCodes = [];

    weathercodeArr.forEach(code => {

        switch(code) {
            case 0:
                readableWeatherCodes.push('Clear Sky');
                break;
            case 1:
                readableWeatherCodes.push('Mainly Clear');
                break;
            case 2:
                readableWeatherCodes.push('Partly Cloudy');
                break;
            case 3:
                readableWeatherCodes.push('Overcast');
                break;
            case 45:
                readableWeatherCodes.push('Fog');
                break;
            case 48:
                readableWeatherCodes.push('Fog Depositing Rime');
                break;
            case 51:
                readableWeatherCodes.push('Light Drizzle');
                break;
            case 53:
                readableWeatherCodes.push('Moderate Drizzle');
                break;
            case 55:
                readableWeatherCodes.push('Dense Drizzle');
                break;
            case 56:
                readableWeatherCodes.push('Light Freezing Drizzle');
                break;
            case 57:
                readableWeatherCodes.push('Moderate Freezing Drizzle');
                break;
            case 61:
                readableWeatherCodes.push('Slight Rain');
                break;
            case 63:
                readableWeatherCodes.push('Moderate Rain');
                break;
            case 65:
                readableWeatherCodes.push('Heavy Rain');
                break;
            case 66:
                readableWeatherCodes.push('Light Freezing Rain');
                break;
            case 67:
                readableWeatherCodes.push('Heavy Freezing Rain');
                break;
            case 71:
                readableWeatherCodes.push('Slight Snowfall');
                break;
            case 73:
                readableWeatherCodes.push('Moderate Snowfall');
                break;
            case 75:
                readableWeatherCodes.push('Heavy Snowfall');
                break;
            case 77:
                readableWeatherCodes.push('Snow Grains');
                break;   
            case 80:
                readableWeatherCodes.push('Slight Rain Showers');
                break;
            case 81:
                readableWeatherCodes.push('Moderate Rain Showers');
                break;
            case 82:
                readableWeatherCodes.push('Violent Rain Showers');
                break;
            case 85:
                readableWeatherCodes.push('Slight Snow Showers');
                break;
            case 86:
                readableWeatherCodes.push('Heavy Snow Showers');
                break;
            case 95:
                readableWeatherCodes.push('Thunderstorm');
                break;
            case 96:
                readableWeatherCodes.push('Thunderstorm with Slight Hail');
                break;
            case 99:
                readableWeatherCodes.push('Thunderstorm with Heavy Hail');
                break;
            default:
                readableWeatherCodes.push(`Ooops! Something went wrong. Please send me a mail with the given code, so I can fix it. Code: WCT${code}`);
                break;                                                                                                 
        }

    });

    return readableWeatherCodes;

}

function datesToNames(dateArr) {
    let names = [];

    dateArr.forEach(date => {

        const day = new Date(date);

        switch(day.getDay()) {

            case 0:
                names.push('Sunday');
                break;
            case 1:
                names.push('Monday');
                break;
            case 2:
                names.push('Tuesday');
                break;
            case 3:
                names.push('Wednesday');
                break;
            case 4:
                names.push('Thursday');
                break;
            case 5:
                names.push('Friday');
                break;
            case 6:
                names.push('Saturday');
                break;
            default:
                names.push(`Ooops! Something went wrong. Please send me a mail with the given code, so I can fix it. Code: DTN${day.getDay()}`)                            

        }

    });

    return names;
}

function windDegreeToCardinal(windDegreeDirectionArr) {

    let CardinalDirection = [];

    windDegreeDirectionArr.forEach(direction => {

        if(direction >= 348.75 || direction < 11.25) {
            CardinalDirection.push('N');

        } else if(direction >= 11.25 && direction < 33.75) {
            CardinalDirection.push('NNE');

        } else if(direction >= 33.75 && direction < 56.25) {
            CardinalDirection.push('NE');

        } else if(direction >= 56.25 && direction < 78.75) {
            CardinalDirection.push('ENE');

        } else if(direction >= 78.75 && direction < 101.25) {
            CardinalDirection.push('E');

        } else if(direction >= 101.25 && direction < 123.75) {
            CardinalDirection.push('ESE');

        } else if(direction >= 123.75 && direction < 146.25) {
            CardinalDirection.push('SE');

        } else if(direction >= 146.25 && direction < 168.75) {
            CardinalDirection.push('SSE');

        } else if(direction >= 168.75 && direction < 191.25) {
            CardinalDirection.push('S');

        } else if(direction >= 191.25 && direction < 213.75) {
            CardinalDirection.push('SSW');

        } else if(direction >= 213.75 && direction < 236.25) {
            CardinalDirection.push('SW');

        } else if(direction >= 236.25 && direction < 258.75) {
            CardinalDirection.push('WSW');

        } else if(direction >= 258.75 && direction < 281.25) {
            CardinalDirection.push('W');
        
        } else if(direction >= 281.25 && direction < 303.75) {
            CardinalDirection.push('WNW');

        } else if(direction >= 303.75 && direction < 326.25) {
            CardinalDirection.push('NW');

        } else if(direction >= 326.25 && direction < 348.75) {
            CardinalDirection.push('N');

        } else {
            CardinalDirection.push(`Ooops! Something went wrong. Please send me a mail with the given code, so I can fix it. Code: WDTC${direction}`);
        }

    });

    return CardinalDirection;

}


function handleKeyDown() {
        
    if(n === 0){
        n++;
        setTimeout(searchSuggestions, 1000);
    }
    
}

function cardClickHandler(num) {

    if(num === shownDay){
        shownDay -= 1;

    } else if(shownDay > num && shownDay !== 0){
        shownDay = num - 1;

    } else {
        shownDay = num;

    }

    displayData(data, region);

}

/* maybe build in later
function handleArrowControl(inputKey) {
    let i = -1;
    if(inputKey === 'ArrowDown' && i < prevSuggestions.length){
        i++;
        if(i > 0){
            prevSuggestions[i].style.backgroundColor = 'rgba(29, 42, 49, 0.9)';
            prevSuggestions[i].style.borderRight = '2px solid #e2712a';
            prevSuggestions[i].style.borderLeft = '2px solid #e2712a';
            prevSuggestions[i - 1].style.backgroundColor = 'rgba(29, 42, 49, 0.6)';
            prevSuggestions[i - 1].style.borderRight = 'none';
            prevSuggestions[i - 1].style.borderLeft = 'none';
        } else if(i === 0){
            prevSuggestions[i].style.backgroundColor = 'rgba(29, 42, 49, 0.9)';
            prevSuggestions[i].style.borderRight = '2px solid #e2712a';
            prevSuggestions[i].style.borderLeft = '2px solid #e2712a';
        }
    }
    else if(inputKey === 'ArrowUp' && i > 0) {
        i--;
        prevSuggestions[i].style.backgroundColor = 'rgba(29, 42, 49, 0.9)';
        prevSuggestions[i].style.borderRight = '2px solid #e2712a';
        prevSuggestions[i].style.borderLeft = '2px solid #e2712a';
        
        prevSuggestions[i + 1].style.backgroundColor = 'rgba(29, 42, 49, 0.6)';
        prevSuggestions[i + 1].style.borderRight = 'none';
        prevSuggestions[i + 1].style.borderLeft = 'none';
    }
}
*/

input.addEventListener('keydown', input => {
    if(notTrackedKeys.indexOf(input.key) === -1 && arrowKeysTracked.indexOf(input.key) === -1){
        handleKeyDown();
    }
    //if(arrowKeysTracked.indexOf(input.key) > -1 && prevSuggestions.length !== 0) handleArrowControl(input.key);

});

function handleWindowClick(e) {
    const target = e;

    if(!(target.matches('.search-options') || target.matches('.search-suggestions') || target.matches('#search-bar'))){
        optionsContainer.style.display = 'none';
    }
}

window.addEventListener('click', input => {
    handleWindowClick(input.target);
});

window.addEventListener('DOMContentLoaded', userPosition);
