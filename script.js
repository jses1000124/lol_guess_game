let champions = [];

async function loadChampions() {
    const res = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/zh_TW/champion.json');
    const data = await res.json();
    champions = Object.values(data.data);
    nextQuestion();
}

async function getRandomSkinUrl(championId) {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/15.6.1/data/zh_TW/champion/${championId}.json`);
    const data = await res.json();
    const skins = data.data[championId].skins;
    const randomSkin = skins[Math.floor(Math.random() * skins.length)];
    return {
        url: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${randomSkin.num}.jpg`,
        skinNum: randomSkin.num
    };
}

function randomPosition() {
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    return `${posX}% ${posY}%`;
}

let correctChampion, correctSkinUrl;

async function nextQuestion() {
    document.getElementById('result-overlay').classList.remove('show');

    const shuffled = champions.sort(() => 0.5 - Math.random());
    const options = shuffled.slice(0, 4);
    correctChampion = options[Math.floor(Math.random() * options.length)];

    const skinData = await getRandomSkinUrl(correctChampion.id);
    correctSkinUrl = skinData.url;

    const imageContainer = document.getElementById('image-container');
    imageContainer.style.backgroundImage = `url('${correctSkinUrl}')`;
    imageContainer.style.backgroundPosition = randomPosition();

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option.name;
        btn.onclick = () => showResult(option.id === correctChampion.id);
        optionsContainer.appendChild(btn);
    });
}

function showResult(isCorrect) {
    const overlay = document.getElementById('result-overlay');
    document.getElementById('full-image').src = correctSkinUrl;
    document.getElementById('result-text').innerHTML = isCorrect
        ? `🎉 答對了！是【${correctChampion.name}】`
        : `❌ 答錯了，正確答案是【${correctChampion.name}】`;

    overlay.classList.add('show');
}

document.getElementById('continue-btn').onclick = nextQuestion;

loadChampions();
