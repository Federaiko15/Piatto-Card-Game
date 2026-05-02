const fisher_yates_shuffle = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const randomNumber = Math.floor(Math.random() * (i + 1));

    [deck[i], deck[randomNumber]] = [deck[randomNumber], deck[i]];
  }
  return deck;
};

const createDeck = () => {
  const seeds = ["denari", "bastoni", "spade", "coppe"];
  var finalDeck = [];
  for (let i = 0; i < 4; i++) {
    for (let k = 1; k <= 10; k++) {
      finalDeck.push({ seed: seeds[i], value: k });
    }
  }

  return fisher_yates_shuffle(finalDeck);
};

export default createDeck;
