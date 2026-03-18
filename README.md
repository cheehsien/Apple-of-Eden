# Apple

**Author:** Qixian Chen, Yixiao Xiao, Yiyan Zhou

**Date:** March 2026

Utilizing facial and hand tracking through ml5.js, this project allows users to interact with a digital apple through scaling, grabbing, and biting actions.

---

## Instructions 

* **Bite to Eat (Face Tracking)**
  * **Action:** Face the camera and open your mouth wide.
  * **Interaction:** The system detects your mouth opening and triggers a "bite". The apple will dynamically crossfade to the next stage. 

* **Grab & Drag (Hand Tracking)**
  * **Action:** Bring your index finger and thumb together (pinch gesture) near any of the floating elements (wings, halo, star).
  * **Interaction:** The targeted element will adhere to your hands, indicating it has been grabbed. You can then drag and reposition it anywhere on the screen.

* **Dynamic Zoom (Two-Handed Tracking)**
  * **Action:** Bring both hands into the camera frame.
  * **Interaction:** Move your hands closer together or further apart. The apple will scale up or down dynamically based on the physical distance between your hands.

* **Fist to Reset (Hand Tracking)**
  * **Action:** Make a closed fist with either hand at any stage of the interaction.
  * **Interaction:** All floating parts will snap back to their default positions, and the apple will smoothly respawn to its initial state.

---

## Acknowledgements
  
* **AI Assistance Declaration:**
  * *This project utilized the AI tool (Gemini) to assist in development and debugging.*
