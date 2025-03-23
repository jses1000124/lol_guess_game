let champions = [];
let championSkinSeries = {}; 

async function loadChampions() {
    const res = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/zh_TW/champion.json');
    const data = await res.json();
    champions = Object.values(data.data);
    
    await preloadChampionSkinData();
}

async function preloadChampionSkinData() {
    for (const champion of champions) {
        try {
            const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/15.6.1/data/zh_TW/champion/${champion.id}.json`);
            const data = await res.json();
            const skins = data.data[champion.id].skins;
            
            championSkinSeries[champion.id] = {
                skins: skins,
                series: extractSkinSeries(skins)
            };
        } catch (error) {
            console.error(`Error loading skin data for ${champion.id}:`, error);
        }
    }
}

function extractSkinSeries(skins) {
    const series = [];
    skins.forEach(skin => {
        if (skin.name && skin.name.includes(' ')) {
            const potentialSeries = skin.name.split(' ')[0];
            if (potentialSeries.length > 1) {
                series.push(potentialSeries);
            }
        }
    });
    return [...new Set(series)]; 
}

async function getRandomSkinUrl(championId) {
    if (championSkinSeries[championId] && championSkinSeries[championId].skins) {
        const skins = championSkinSeries[championId].skins;
        const randomSkin = skins[Math.floor(Math.random() * skins.length)];
        return {
            url: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${randomSkin.num}.jpg`,
            skinNum: randomSkin.num,
            skinName: randomSkin.name
        };
    }
    
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/15.6.1/data/zh_TW/champion/${championId}.json`);
    const data = await res.json();
    const skins = data.data[championId].skins;
    const randomSkin = skins[Math.floor(Math.random() * skins.length)];
    return {
        url: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${randomSkin.num}.jpg`,
        skinNum: randomSkin.num,
        skinName: randomSkin.name
    };
}

function randomPosition() {
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    return `${posX}% ${posY}%`;
}

let correctChampion, correctSkinUrl, correctSkinName;

async function nextQuestion() {
    document.getElementById('result-overlay').classList.remove('show');
    
    // Hide options container while loading
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.style.display = 'none';
    
    // Show loading indicator
    const imageContainer = document.getElementById('image-container');
    imageContainer.style.backgroundImage = '';
    imageContainer.classList.add('loading');

    const shuffled = champions.sort(() => 0.5 - Math.random());
    
    correctChampion = shuffled[Math.floor(Math.random() * shuffled.length)];
    
    const skinData = await getRandomSkinUrl(correctChampion.id);
    correctSkinUrl = skinData.url;
    correctSkinName = skinData.skinName || "";
    
    // Preload the image before showing options
    await preloadImage(correctSkinUrl);
    
    // Set background image after it's loaded
    imageContainer.style.backgroundImage = `url('${correctSkinUrl}')`;
    imageContainer.style.backgroundPosition = randomPosition();
    imageContainer.classList.remove('loading');

    // Generate options only after image is loaded
    const options = generateCompatibleOptions(correctChampion, correctSkinName);
    
    // Show the options container and clear any previous content
    optionsContainer.style.display = 'block';
    optionsContainer.innerHTML = '';

    options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option.name;
        btn.onclick = () => showResult(option.id === correctChampion.id);
        optionsContainer.appendChild(btn);
    });
}

// Function to preload image
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

function generateCompatibleOptions(correctChamp, skinName) {
    const selectedOptions = [correctChamp];
    
    let correctChampSeries = [];
    if (skinName && championSkinSeries[correctChamp.id]) {
        correctChampSeries = championSkinSeries[correctChamp.id].series;
    }
    
    const shuffled = champions.filter(champ => 
        !(
            (correctChamp.id === "Xayah" && champ.id === "Rakan") ||
            (correctChamp.id === "Rakan" && champ.id === "Xayah")
        )
    ).sort(() => 0.5 - Math.random());
    
    let count = 0;
    for (const champ of shuffled) {
        if (champ.id === correctChamp.id) continue;
        
        if (correctChampSeries.length > 0 && championSkinSeries[champ.id]) {
            const champSeries = championSkinSeries[champ.id].series;
            if (champSeries.some(series => correctChampSeries.includes(series))) {
                continue; 
            }
        }
        
        selectedOptions.push(champ);
        count++;
        
        if (count >= 3) break; // We need 4 options total (1 correct + 3 others)
    }
    
    // If we couldn't find enough champions meeting all criteria, just add more random ones
    if (selectedOptions.length < 4) {
        for (const champ of shuffled) {
            if (!selectedOptions.find(c => c.id === champ.id)) {
                selectedOptions.push(champ);
                if (selectedOptions.length >= 4) break;
            }
        }
    }
    
    // Shuffle the options so correct answer isn't always in the same position
    return selectedOptions.sort(() => 0.5 - Math.random());
}

function showResult(isCorrect) {
    const overlay = document.getElementById('result-overlay');
    document.getElementById('full-image').src = correctSkinUrl;
    
    let resultText = isCorrect
        ? `🎉 答對了！是【${correctChampion.name}】`
        : `❌ 答錯了，正確答案是【${correctChampion.name}】`;
        
    // Add skin name information if available
    if (correctSkinName && correctSkinName !== "default") {
        resultText += `<br><span style="font-size: 0.9em;">${correctSkinName}</span>`;
    }
    
    document.getElementById('result-text').innerHTML = resultText;
    overlay.classList.add('show');
}

document.getElementById('continue-btn').onclick = () => {
    if (window.prepareNextQuestion) {
        window.prepareNextQuestion();
    } else {
        nextQuestion(); 
    }
};

loadChampions();