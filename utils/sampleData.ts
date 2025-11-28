export const SAMPLE_YAML = `- id: start
  speaker: Innkeeper
  text: "Welcome to the Prancing Pony! What can I get you?"
  choices:
    - text: "Just some ale."
      nextId: order_ale
    - text: "I'm looking for information."
      nextId: ask_info
    - text: "Nothing, just passing through."
      nextId: leave

- id: order_ale
  speaker: Innkeeper
  text: "Coming right up! That'll be 2 gold coins."
  choices:
    - text: "Here you go."
      nextId: drink_ale
    - text: "Too expensive!"
      nextId: start

- id: ask_info
  speaker: Innkeeper
  text: "Information isn't free, traveler. Do you have coin?"
  choices:
    - text: "Pay 5 gold."
      nextId: secret_reveal
    - text: "Intimidate him."
      nextId: fight_start

- id: drink_ale
  speaker: Player
  text: "*You enjoy a refreshing cold ale.*"
  choices: []

- id: secret_reveal
  speaker: Innkeeper
  text: "The dragon sleeps in the northern cave. Be careful."
  choices:
    - text: "Thanks."
      nextId: leave

- id: fight_start
  speaker: System
  text: "COMBAT STARTED"
  choices: []

- id: leave
  speaker: Player
  text: "*You leave the inn.*"
  choices: []
`;

export const SCHEMA_JSON = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "description": "A list of dialogue nodes representing the RPG conversation tree.",
  "items": {
    "type": "object",
    "required": ["id", "text"],
    "properties": {
      "id": {
        "type": "string",
        "description": "Unique identifier for the dialogue node."
      },
      "speaker": {
        "type": "string",
        "description": "Name of the character speaking."
      },
      "text": {
        "type": "string",
        "description": "The dialogue content."
      },
      "choices": {
        "type": "array",
        "description": "Possible player responses leading to other nodes.",
        "items": {
          "type": "object",
          "required": ["text", "nextId"],
          "properties": {
            "text": {
              "type": "string",
              "description": "The text displayed to the player."
            },
            "nextId": {
              "type": "string",
              "description": "The ID of the target node this choice leads to."
            },
            "condition": {
              "type": "string",
              "description": "Optional logic condition required to see this choice."
            }
          }
        }
      }
    }
  }
};
