"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportType = exports.AchievementType = exports.MilestoneType = exports.ProgressStatus = void 0;
/**
 * Progress status enum
 */
var ProgressStatus;
(function (ProgressStatus) {
    ProgressStatus["NOT_STARTED"] = "not_started";
    ProgressStatus["IN_PROGRESS"] = "in_progress";
    ProgressStatus["COMPLETED"] = "completed";
})(ProgressStatus || (exports.ProgressStatus = ProgressStatus = {}));
/**
 * Milestone types
 */
var MilestoneType;
(function (MilestoneType) {
    MilestoneType["PATH_STARTED"] = "path_started";
    MilestoneType["MODULE_COMPLETED"] = "module_completed";
    MilestoneType["PATH_COMPLETED"] = "path_completed";
    MilestoneType["STREAK_ACHIEVED"] = "streak_achieved";
    MilestoneType["MASTERY_DEMONSTRATED"] = "mastery_demonstrated";
    MilestoneType["PERSEVERANCE_SHOWN"] = "perseverance_shown";
})(MilestoneType || (exports.MilestoneType = MilestoneType = {}));
/**
 * Achievement types
 */
var AchievementType;
(function (AchievementType) {
    AchievementType["COMPLETION"] = "completion";
    AchievementType["MASTERY"] = "mastery";
    AchievementType["STREAK"] = "streak";
    AchievementType["MILESTONE"] = "milestone";
    AchievementType["EXPLORATION"] = "exploration";
})(AchievementType || (exports.AchievementType = AchievementType = {}));
/**
 * Report types
 */
var ReportType;
(function (ReportType) {
    ReportType["DAILY"] = "daily";
    ReportType["WEEKLY"] = "weekly";
    ReportType["MONTHLY"] = "monthly";
    ReportType["CUSTOM"] = "custom";
})(ReportType || (exports.ReportType = ReportType = {}));
//# sourceMappingURL=progress.js.map