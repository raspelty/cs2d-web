function updateEnemies(state: GameState, dt: number) {
  const map = state.currentMap;
  if (!state.navMesh) return;
  
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    // Stuck detection
    if (!enemy.hasOwnProperty('stuckTimer')) {
      (enemy as any).stuckTimer = 0;
      (enemy as any).lastPos = { ...enemy.pos };
      (enemy as any).pathUpdateTimer = 0;
      (enemy as any).investigateTimer = 0;
    }

    // Check if stuck
    const distMoved = distance(enemy.pos, (enemy as any).lastPos);
    if (distMoved < 3) {
      (enemy as any).stuckTimer += dt;
    } else {
      (enemy as any).stuckTimer = 0;
    }
    (enemy as any).lastPos = { ...enemy.pos };

    // If stuck for too long, teleport a bit
    if ((enemy as any).stuckTimer > 3) {
      (enemy as any).stuckTimer = 0;
      const newPos = state.navMesh.getRandomPositionInArea(enemy.pos, 100);
      enemy.pos = newPos;
      enemy.path = undefined;
    }

    // Determine target based on game state
    let targetPos: Vec2 | null = null;
    let canSeeTarget = false;
    let priority = 0;

    // Priority 1: Bomb if planted
    if (state.bomb && state.bomb.isPlanted && !state.bomb.isDefused) {
      targetPos = state.bomb.pos;
      priority = 3;
      enemy.state = 'defending';
    }

    // Priority 2: Player if visible
    if (state.player.alive) {
      const canSeePlayer = hasLineOfSight(enemy.pos, state.player.pos, map.walls);
      const distToPlayer = distance(enemy.pos, state.player.pos);
      
      if (canSeePlayer && distToPlayer < 800) {
        targetPos = state.player.pos;
        canSeeTarget = true;
        priority = 2;
        enemy.state = 'chase';
        enemy.lastKnownPlayerPos = { ...state.player.pos };
        enemy.alertTimer = 10;
      } else if (enemy.lastKnownPlayerPos && distToPlayer < 1000) {
        // Investigate last known position
        targetPos = enemy.lastKnownPlayerPos;
        priority = 1;
        enemy.state = 'searching';
        (enemy as any).investigateTimer += dt;
        
        // Give up searching after 10 seconds
        if ((enemy as any).investigateTimer > 10) {
          enemy.lastKnownPlayerPos = null;
          enemy.state = 'patrol';
        }
      }
    }

    // Priority 3: Allies if visible
    if (!targetPos || priority < 2) {
      for (const ally of state.allies) {
        if (!ally.alive) continue;
        if (hasLineOfSight(enemy.pos, ally.pos, map.walls) && 
            distance(enemy.pos, ally.pos) < 600) {
          targetPos = ally.pos;
          canSeeTarget = true;
          enemy.state = 'chase';
          break;
        }
      }
    }

    // If no target, patrol
    if (!targetPos) {
      enemy.alertTimer -= dt;
      
      if (enemy.alertTimer <= 0 || !enemy.patrolTarget) {
        enemy.state = 'patrol';
        enemy.patrolTarget = state.navMesh.getRandomPosition();
        targetPos = enemy.patrolTarget;
      } else {
        targetPos = enemy.patrolTarget;
      }
    }

    // Pathfinding and movement
    if (targetPos) {
      // Update path periodically
      (enemy as any).pathUpdateTimer += dt;
      if (!enemy.path || enemy.path.length === 0 || (enemy as any).pathUpdateTimer > 0.8) {
        (enemy as any).pathUpdateTimer = 0;
        enemy.path = state.navMesh.findPath(enemy.pos, targetPos);
      }

      // Follow path
      if (enemy.path && enemy.path.length > 0) {
        let targetPoint = enemy.path[0];
        
        if (distance(enemy.pos, targetPoint) < 25) {
          enemy.path.shift();
          if (enemy.path.length > 0) {
            targetPoint = enemy.path[0];
          }
        }

        if (targetPoint) {
          const dir = normalize({
            x: targetPoint.x - enemy.pos.x,
            y: targetPoint.y - enemy.pos.y
          });

          // Speed based on state
          let speed = enemy.speed;
          if (enemy.state === 'patrol') speed *= 0.5;
          if (enemy.state === 'defending') speed *= 0.7;

          const newX = enemy.pos.x + dir.x * speed * dt;
          const newY = enemy.pos.y + dir.y * speed * dt;

          // Collision detection
          let canMove = true;
          for (const wall of map.walls) {
            if (circleRectCollision(newX, newY, enemy.radius, wall.x, wall.y, wall.w, wall.h)) {
              canMove = false;
              break;
            }
          }

          // Avoid other enemies
          for (const other of state.enemies) {
            if (other.id !== enemy.id && other.alive) {
              if (distance({ x: newX, y: newY }, other.pos) < enemy.radius * 2.5) {
                canMove = false;
                break;
              }
            }
          }

          if (canMove) {
            enemy.pos.x = newX;
            enemy.pos.y = newY;
          } else {
            // Try a different direction
            const avoidDir = {
              x: dir.y * 0.5,
              y: -dir.x * 0.5
            };
            enemy.pos.x += avoidDir.x * speed * dt;
            enemy.pos.y += avoidDir.y * speed * dt;
          }
        }
      }
    }

    // Update angle to face target
    if (targetPos) {
      enemy.angle = Math.atan2(targetPos.y - enemy.pos.y, targetPos.x - enemy.pos.x);
    }

    // Shooting
    enemy.shootCooldown -= dt;
    if (targetPos && canSeeTarget && enemy.shootCooldown <= 0) {
      const distToTarget = distance(enemy.pos, targetPos);
      if (distToTarget < 700) {
        // Accuracy based on distance and enemy state
        let accuracy = 0.7;
        if (enemy.state === 'defending') accuracy = 0.8;
        if (enemy.state === 'patrol') accuracy = 0.4;
        accuracy *= (1 - distToTarget / 1000);
        
        if (Math.random() < accuracy) {
          enemyShoot(state, enemy, targetPos);
        } else {
          enemy.shootCooldown = 0.2;
        }
      }
    }
  }
}
