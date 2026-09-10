import { Server as HttpServer } from 'http';
import { redisService } from '../redis/redis-service.js';
import { MatchmakerService } from '../services/matchmaker.service.js';
import { GameEngineService } from '../services/game-engine.service.js';
import { GatewayService } from '../services/gateway.service.js';

export function createGameWebSocketServer(httpServer: HttpServer) {
  const matchmaker = new MatchmakerService(redisService);
  const gameEngine = new GameEngineService(redisService);
  const gateway = new GatewayService(httpServer, {
    redis: redisService,
    matchmaker,
    gameEngine,
  });

  // Start microservice workers
  matchmaker.start();
  gameEngine.start();

  return {
    gateway,
    gameEngine,
    matchmaker,
    roomManager: gameEngine.getRoomManager(),
    redis: redisService,
  };
}
