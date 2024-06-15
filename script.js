let currentLanguage = 'ja'; // 現在の言語を保持する変数

async function fetchPokemonData() {
    const input = document.getElementById('pokemon-input').value.toLowerCase(); // 入力されたポケモン名またはIDを取得し、小文字に変換
    const searchUrl = `https://pokeapi.co/api/v2/pokemon-species/${input}/`; // PokeAPIの種情報URLを構築

    try {
        // 入力を使用して直接種データを取得
        let speciesData = await fetchPokemonSpeciesData(searchUrl);

        // 見つからなかった場合、名前で探す
        if (!speciesData && isNaN(input)) {
            speciesData = await findPokemonSpeciesByName(input);
        }

        if (!speciesData) throw new Error('Pokemon not found'); // 見つからなかった場合はエラーを投げる

        // 英語の名前と説明を取得
        const name = speciesData.names.find(name => name.language.name === 'en').name;
        const description = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en').flavor_text;

        // 取得したデータを表示
        displayPokemonData(speciesData, name, description);
    } catch (error) {
        console.error(error); // エラーをコンソールに表示
        alert('Pokemon not found'); // アラートを表示
    }
}

async function fetchPokemonSpeciesData(url) {
    try {
        const response = await fetch(url); // 指定されたURLからデータを取得
        if (!response.ok) throw new Error('Data not found'); // 取得に失敗した場合はエラーを投げる
        return await response.json(); // JSON形式でデータを返す
    } catch (error) {
        return null; // エラーの場合はnullを返す
    }
}

async function findPokemonSpeciesByName(name) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species?limit=10000`); // 全てのポケモン種データを取得
        const data = await response.json();
        // 名前でポケモン種を検索
        return data.results.find(species => {
            return species.name.toLowerCase() === name.toLowerCase();
        }) || data.results.find(species => {
            return fetchPokemonSpeciesData(species.url)
                .then(speciesData => {
                    // 英語または日本語の名前を持つ種を検索
                    return speciesData.names.some(n => n.name.toLowerCase() === name.toLowerCase() && (n.language.name === 'ja' || n.language.name === 'en'));
                });
        });
    } catch (error) {
        return null; // エラーの場合はnullを返す
    }
}

function displayPokemonData(speciesData, name, description) {
    document.getElementById('pokemon-name').textContent = name; // ポケモンの名前を表示
    document.getElementById('pokemon-description').textContent = description; // ポケモンの説明を表示

    // ポケモンの画像を取得して表示
    fetch(`https://pokeapi.co/api/v2/pokemon/${speciesData.name}`)
        .then(response => response.json())
        .then(data => {
            const imageUrl = data.sprites.front_default; // 画像URLを取得
            document.getElementById('pokemon-image').src = imageUrl; // 画像を設定

            // 画像をクリックしたときの処理を追加
            document.getElementById('pokemon-image').addEventListener('click', function() {
                openPopup(imageUrl); // ポップアップを開く
            });
        });
}

function openPopup(imageUrl) {
    const popupContainer = document.getElementById('popup-container');
    const popupImage = document.getElementById('popup-image');
    const popupClose = document.getElementById('popup-close');

    popupImage.src = imageUrl; // ポップアップの画像を設定
    popupContainer.style.display = 'block'; // ポップアップを表示

    // ポップアップを閉じる処理
    popupClose.addEventListener('click', function() {
        popupContainer.style.display = 'none'; // ポップアップを非表示にする
    });
}

async function setLanguage(lang) {
    currentLanguage = lang; // 現在の言語を更新
    const nameElement = document.getElementById('pokemon-name');
    const descriptionElement = document.getElementById('pokemon-description');

    const name = nameElement.textContent; // 現在の名前を取得
    const description = descriptionElement.textContent; // 現在の説明を取得

    const translatedName = await translateText(name, currentLanguage); // 名前を翻訳
    const translatedDescription = await translateText(description, currentLanguage); // 説明を翻訳

    nameElement.textContent = translatedName; // 翻訳された名前を表示
    descriptionElement.textContent = translatedDescription; // 翻訳された説明を表示
}

async function translateText(text, targetLang) {
    const apiKey = ''; // Google APIキーを設定
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`; // 翻訳APIのURLを構築

    const response = await fetch(url, {
        method: 'POST', // POSTメソッドでリクエスト
        body: JSON.stringify({
            q: text,
            target: targetLang,
        }),
        headers: {
            'Content-Type': 'application/json' // リクエストヘッダーを設定
        }
    });

    const data = await response.json(); // JSON形式でレスポンスを取得
    return data.data.translations[0].translatedText; // 翻訳されたテキストを返す
}

