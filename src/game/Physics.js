export function processGravity(player, deltaTime) {
  if (!deltaTime || deltaTime <= 0) throw new Error('processGravity requires deltaTime');

  const playerNotGrounded = player.y > groundLevel(player.x, player.y, player.z);
  const playerVerticalMovement = Math.abs(player.velocity.y) !== 0;

  // vertical movement, either falling and jumping
  if (playerNotGrounded || playerVerticalMovement) {
    // convert deltaTime (ms) to seconds for our math
    const time = deltaTime / 1000;

    // move player based on velocity
    player.y = player.y + player.velocity.y * time;

    // calculate new velocity over delta time and ensure velocity does not go below zero
    const velocity_y = v_va(player.velocity.y, g)(time);
    player.velocity.y = velocity_y;

    // when player touches ground, set velocity to 0
    if (player.y <= groundLevel(player.x, player.y, player.z)) {
      // stop velocity, hit the ground
      player.y = 0;
      player.velocity.y = 0;
    }

    // console.debug('[processGravity]', player.y, player.velocity.y);
  }
}

const g = -9.8 * 2;

// for now ground level is always zero but eventually this may be a function of player position
// for example, there may be a spot on the zone map where the ground is not 0 and is instead 500 or -500
const groundLevel = (x, y, z) => 0;

// velocity as function of time
const v_va = (v, a) => (t) => v + a * t;

// displacement as a function of time and initial velocity
// d = (v * t) + (0.5 * a * t^2)
// const d_va = (v, a) => (t) => v * t + 0.5 * g * Math.pow(t, 2);
