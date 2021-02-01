export function processGravity(player, deltaTime) {
  if (!deltaTime || deltaTime <= 0) throw new Error('processGravity requires deltaTime');

  const playerNotGrounded = player.y > groundLevel(player.x, player.y, player.z);
  const playerVerticalMovement = Math.abs(player.velocity.y) !== 0;

  // vertical movement, either falling and jumping
  if (playerNotGrounded || playerVerticalMovement) {
    // convert deltaTime (ms) to seconds for our math
    const time = deltaTime / 1000;

    // calculate new position based on velocity
    player.y += p_vg(player.velocity.y, time);

    // calculate new velocity based on gravity (v_g)
    player.velocity.y += v_g(time);

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

// change in velocity as function of time
const v_a = (a) => (t) => a * t;
const v_g = v_a(g);

// displacement (change in position) as a function of time (using acceleration and velocity)
// i.e. d = (v * t) + (0.5 * a * t^2)
const p_va = (v, a) => (t) => v * t + 0.5 * a * Math.pow(t, 2);
const p_vg = (v, t) => p_va(v, g)(t);
