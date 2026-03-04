/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const core_1 = __webpack_require__(2);
const throttler_1 = __webpack_require__(5);
const events_module_1 = __webpack_require__(6);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'default',
                    ttl: 60_000, // 1 minute
                    limit: 100, // max requests per IP per ttl
                },
            ]),
            events_module_1.EventsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/throttler");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const data_access_1 = __webpack_require__(7);
const events_controller_1 = __webpack_require__(14);
const events_service_1 = __webpack_require__(15);
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [data_access_1.DataAccessModule],
        controllers: [events_controller_1.EventsController],
        providers: [events_service_1.EventsService],
    })
], EventsModule);


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(4);
tslib_1.__exportStar(__webpack_require__(8), exports);
tslib_1.__exportStar(__webpack_require__(13), exports);
tslib_1.__exportStar(__webpack_require__(9), exports);
tslib_1.__exportStar(__webpack_require__(12), exports);


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataAccessModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const events_repository_service_1 = __webpack_require__(9);
let DataAccessModule = class DataAccessModule {
};
exports.DataAccessModule = DataAccessModule;
exports.DataAccessModule = DataAccessModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [events_repository_service_1.EventsRepository],
        exports: [events_repository_service_1.EventsRepository],
    })
], DataAccessModule);


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var EventsRepository_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsRepository = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const promises_1 = __webpack_require__(10);
const node_path_1 = __webpack_require__(11);
const events_filter_1 = __webpack_require__(12);
let EventsRepository = EventsRepository_1 = class EventsRepository {
    constructor() {
        this.logger = new common_1.Logger(EventsRepository_1.name);
        this.cachedEvents = null;
    }
    async getAllEvents() {
        if (this.cachedEvents) {
            return this.cachedEvents;
        }
        const events = await this.loadEventsFromDisk();
        const liveStats = await this.loadLiveStatsFromDisk();
        this.cachedEvents = (0, events_filter_1.mergeEventsWithStats)(events, liveStats);
        return this.cachedEvents;
    }
    async getEventById(id) {
        const events = await this.getAllEvents();
        return events.find((event) => event.id === id);
    }
    async getAllSports() {
        const events = await this.getAllEvents();
        const sports = new Set(events.map((event) => event.sport));
        return Array.from(sports).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
    }
    async loadEventsFromDisk() {
        const path = (0, node_path_1.resolve)(process.cwd(), 'apps/api/src/data/events.json');
        try {
            const fileContents = await (0, promises_1.readFile)(path, { encoding: 'utf-8' });
            const parsed = JSON.parse(fileContents);
            return parsed;
        }
        catch (error) {
            this.logger.error(`Failed to load events from ${path}`, error);
            throw new common_1.InternalServerErrorException('Failed to load events data');
        }
    }
    async loadLiveStatsFromDisk() {
        const path = (0, node_path_1.resolve)(process.cwd(), 'apps/api/src/data/live-stats.json');
        try {
            const fileContents = await (0, promises_1.readFile)(path, { encoding: 'utf-8' });
            const parsed = JSON.parse(fileContents);
            return parsed;
        }
        catch (error) {
            this.logger.error(`Failed to load live stats from ${path}`, error);
            throw new common_1.InternalServerErrorException('Failed to load live stats data');
        }
    }
};
exports.EventsRepository = EventsRepository;
exports.EventsRepository = EventsRepository = EventsRepository_1 = tslib_1.__decorate([
    (0, common_1.Injectable)()
], EventsRepository);


/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("node:fs/promises");

/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.filterEvents = filterEvents;
exports.mergeEventsWithStats = mergeEventsWithStats;
const event_types_1 = __webpack_require__(13);
/**
 * Normalized filter criteria for a single pass over events (avoids repeated lowercasing).
 */
function normalizeCriteria(criteria) {
    const sportLower = criteria.sport?.trim() != null && criteria.sport.trim() !== ''
        ? criteria.sport.trim().toLowerCase()
        : null;
    const rawSearch = criteria.search?.trim() ?? '';
    const searchLower = rawSearch !== '' ? rawSearch.toLowerCase() : null;
    return {
        liveOnly: Boolean(criteria.liveOnly),
        status: criteria.status,
        sportLower,
        searchLower,
    };
}
function filterEvents(events, criteria) {
    const { liveOnly, status, sportLower, searchLower } = normalizeCriteria(criteria);
    return events.filter((event) => {
        if (liveOnly && event.status !== event_types_1.EventStatus.Live) {
            return false;
        }
        if (status != null && event.status !== status) {
            return false;
        }
        if (sportLower != null && event.sport.toLowerCase() !== sportLower) {
            return false;
        }
        if (searchLower != null && !event.title.toLowerCase().includes(searchLower)) {
            return false;
        }
        return true;
    });
}
function mergeEventsWithStats(events, liveStats) {
    const liveStatsByEventId = new Map(liveStats.map((stats) => [stats.eventId, stats]));
    return events.map((event) => {
        const stats = liveStatsByEventId.get(event.id);
        if (!stats || event.status !== event_types_1.EventStatus.Live) {
            return { ...event, liveStats: undefined };
        }
        return {
            ...event,
            liveStats: stats,
        };
    });
}


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamHealth = exports.EventStatus = void 0;
var EventStatus;
(function (EventStatus) {
    EventStatus["Upcoming"] = "upcoming";
    EventStatus["Live"] = "live";
    EventStatus["Completed"] = "completed";
})(EventStatus || (exports.EventStatus = EventStatus = {}));
var StreamHealth;
(function (StreamHealth) {
    StreamHealth["Excellent"] = "excellent";
    StreamHealth["Good"] = "good";
    StreamHealth["Fair"] = "fair";
    StreamHealth["Poor"] = "poor";
})(StreamHealth || (exports.StreamHealth = StreamHealth = {}));


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsController = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const events_service_1 = __webpack_require__(15);
const events_query_dto_1 = __webpack_require__(16);
let EventsController = class EventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    getEvents(query) {
        return this.eventsService.getEvents(query);
    }
    getEventById(id) {
        return this.eventsService.getEventById(id);
    }
    getSports() {
        return this.eventsService.getSports();
    }
};
exports.EventsController = EventsController;
tslib_1.__decorate([
    (0, common_1.Get)('events'),
    tslib_1.__param(0, (0, common_1.Query)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof events_query_dto_1.EventsQueryDto !== "undefined" && events_query_dto_1.EventsQueryDto) === "function" ? _b : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], EventsController.prototype, "getEvents", null);
tslib_1.__decorate([
    (0, common_1.Get)('events/:id'),
    tslib_1.__param(0, (0, common_1.Param)('id')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], EventsController.prototype, "getEventById", null);
tslib_1.__decorate([
    (0, common_1.Get)('sports'),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], EventsController.prototype, "getSports", null);
exports.EventsController = EventsController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof events_service_1.EventsService !== "undefined" && events_service_1.EventsService) === "function" ? _a : Object])
], EventsController);


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const data_access_1 = __webpack_require__(7);
let EventsService = class EventsService {
    constructor(eventsRepository) {
        this.eventsRepository = eventsRepository;
    }
    async getEvents(query) {
        const allEvents = await this.eventsRepository.getAllEvents();
        return (0, data_access_1.filterEvents)(allEvents, query);
    }
    async getEventById(id) {
        const event = await this.eventsRepository.getEventById(id);
        if (!event) {
            throw new common_1.NotFoundException(`Event with id ${id} not found`);
        }
        return event;
    }
    async getSports() {
        return this.eventsRepository.getAllSports();
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof data_access_1.EventsRepository !== "undefined" && data_access_1.EventsRepository) === "function" ? _a : Object])
], EventsService);


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsQueryDto = void 0;
const tslib_1 = __webpack_require__(4);
const data_access_1 = __webpack_require__(7);
const class_transformer_1 = __webpack_require__(17);
const class_validator_1 = __webpack_require__(18);
class EventsQueryDto {
}
exports.EventsQueryDto = EventsQueryDto;
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(data_access_1.EventStatus),
    tslib_1.__metadata("design:type", typeof (_a = typeof data_access_1.EventStatus !== "undefined" && data_access_1.EventStatus) === "function" ? _a : Object)
], EventsQueryDto.prototype, "status", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], EventsQueryDto.prototype, "sport", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    tslib_1.__metadata("design:type", String)
], EventsQueryDto.prototype, "search", void 0);
tslib_1.__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    tslib_1.__metadata("design:type", Boolean)
], EventsQueryDto.prototype, "liveOnly", void 0);


/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const common_1 = __webpack_require__(1);
const core_1 = __webpack_require__(2);
const app_module_1 = __webpack_require__(3);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    common_1.Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
bootstrap();

})();

/******/ })()
;
//# sourceMappingURL=main.js.map