# Alexa Wortspiel (word chain) skill

Word chain is a game where two or more players take turns in saying words, where every next word should begin with the letter that the previous word ended.

An example word chain is: Chair ~ Result ~ Table ~ Elephant, and so on.

Feel free to clone this repo and adopt it to create your own skill. Original "Wortspiel" skill can be found here: [https://www.amazon.de/Intersolve-GbR-Wortspiel/dp/B06W2J949H](https://www.amazon.de/Intersolve-GbR-Wortspiel/dp/B06W2J949H)

## Prerequisites

    - MySQL database
    - NodeJS
    
### Create the database

    CREATE TABLE IF NOT EXISTS `highscores` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `user_id` varchar(2048) NOT NULL,
      `score` int(11) NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

## Installation

Edit config.js file to match your configuration. Run

    $ npm install
    
After that you have to configure your skill in the amazon developer console. 

The interaction-model should look like the following

    {
        "interactionModel": {
            "languageModel": {
                "invocationName": "wort spiel",
                "intents": [
                    {
                        "name": "GetWord",
                        "slots": [
                            {
                                "name": "Keyword",
                                "type": "LIST_OF_KEYWORDS"
                            }
                        ],
                        "samples": [
                            "{Keyword}"
                        ]
                    },
                    {
                        "name": "AMAZON.YesIntent",
                        "samples": []
                    },
                    {
                        "name": "AMAZON.NoIntent",
                        "samples": []
                    },
                    {
                        "name": "AMAZON.HelpIntent",
                        "samples": [
                            "Hilfe"
                        ]
                    },
                    {
                        "name": "AMAZON.StopIntent",
                        "samples": [
                            "stopp",
                            "hör endlich auf",
                            "aufhören"
                        ]
                    },
                    {
                        "name": "AMAZON.CancelIntent",
                        "samples": [
                            "abbrechen",
                            "abbreche",
                            "vergiss es"
                        ]
                    },
                    {
                        "name": "AMAZON.NavigateHomeIntent",
                        "samples": []
                    }
                ],
                "types": [
                    {
                        "name": "LIST_OF_KEYWORDS",
                        "values": [
                            {
                                "name": {
                                    "value": "HalloGalli"
                                }
                            }
                        ]
                    }
                ]
            }
        }
    }
