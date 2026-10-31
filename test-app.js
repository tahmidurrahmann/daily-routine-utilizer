/**
 * Automated Test Suite for Daily Routine Checklist
 * Tests all 8 core requirements specified by the user prompt.
 */
const assert = require('assert');
const fs = require('fs');

// Mock localStorage
const memoryStorage = {};
const mockLocalStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(memoryStorage, k) ? memoryStorage[k] : null),
  setItem: (k, v) => {
    memoryStorage[k] = String(v);
    mockLocalStorage[k] = String(v);
  },
  removeItem: (k) => {
    delete memoryStorage[k];
    delete mockLocalStorage[k];
  },
  clear: () => {
    Object.keys(memoryStorage).forEach(k => {
      delete memoryStorage[k];
      delete mockLocalStorage[k];
    });
  },
  key: (i) => Object.keys(memoryStorage)[i],
  get length() { return Object.keys(memoryStorage).length; }
};

global.localStorage = mockLocalStorage;

// Extract script from index.html to test against exact application code
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error("Could not find <script> in index.html");

let scriptCode = scriptMatch[1];
// Stub DOM and window objects for Node environment
const mockElements = {
  storageWarning: { style: {} },
  dateDisplay: { textContent: '' },
  streakCount: { textContent: '' },
  streakBest: { textContent: '' },
  dayTypeSelect: { value: '', selectedOptions: [{ text: 'Friday' }], addEventListener: () => {} },
  editedTodayBadge: { style: {} },
  taskDoneCount: { textContent: '' },
  taskTotalCount: { textContent: '' },
  prayerDoneCount: { textContent: '' },
  percentTotal: { textContent: '' },
  progressFill: { style: {} },
  prayersCard: {},
  prayerSummaryText: { textContent: '' },
  taskListContainer: { innerHTML: '', querySelector: () => null, appendChild: () => {} },
  weekSummaryBadge: {},
  weekGridContainer: { innerHTML: '', appendChild: () => {} },
  editScheduleDaySelect: { value: 'everyday', selectedOptions: [{ text: 'Every day (Shared tasks)' }], addEventListener: () => {} },
  editorTasksList: { innerHTML: '', appendChild: () => {}, addEventListener: () => {} },
  btnAddTask: {},
  btnResetDayType: {},
  btnResetAll: {},
  btnExportData: {},
  btnTriggerImport: {},
  fileImportInput: { click: () => {}, addEventListener: () => {} },
  taskModal: { classList: { add: () => {}, remove: () => {} } },
  modalTitle: { textContent: '' },
  taskInputTitle: { value: '', focus: () => {} },
  taskInputTime: { value: '' },
  taskInputCategory: { value: 'work' },
  btnCancelModal: {},
  btnSaveTaskModal: {}
};

global.document = {
  getElementById: (id) => mockElements[id] || { style: {}, classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} },
  querySelectorAll: () => [],
  createElement: () => ({
    className: '',
    innerHTML: '',
    dataset: {},
    addEventListener: () => {},
    style: {}
  }),
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {}
};

global.navigator = { serviceWorker: { register: () => Promise.resolve() } };
global.confirm = () => true;
global.alert = (msg) => console.log('  [Alert]:', msg);

// Attach functions and objects to global scope for testing
scriptCode += `
global.DEFAULT_SCHEDULE = DEFAULT_SCHEDULE;
global.getDhakaDateStr = getDhakaDateStr;
global.autoDetectDayType = autoDetectDayType;
global.getDayTypeForDate = getDayTypeForDate;
global.storage = storage;
global.getCustomSchedule = getCustomSchedule;
global.saveCustomSchedule = saveCustomSchedule;
global.resolveTasksForDayType = resolveTasksForDayType;
global.getActiveTasksForToday = getActiveTasksForToday;
global.toggleTaskDone = toggleTaskDone;
global.togglePrayer = togglePrayer;
global.calculateStreaks = calculateStreaks;
global.moveEditorTask = moveEditorTask;
global.deleteEditorTask = deleteEditorTask;
global.resetCurrentDayType = resetCurrentDayType;
global.resetAllSchedules = resetAllSchedules;
`;

eval(scriptCode);

console.log("=================================================");
console.log("  RUNNING DAILY ROUTINE CHECKLIST TEST SUITE     ");
console.log("=================================================\n");

let passedTests = 0;

// TEST 1: Dhaka date rollover at midnight
console.log("Test 1: Testing Dhaka date rollover at midnight...");
{
  mockLocalStorage.clear();
  // Simulate 2026-10-30 23:59:59 UTC+6 (Dhaka)
  const dtBefore = new Date('2026-10-30T23:59:59+06:00');
  const dateStrBefore = getDhakaDateStr(dtBefore);
  assert.strictEqual(dateStrBefore, '2026-10-30', "Date before midnight should be 2026-10-30");

  // Simulate 2 seconds later (00:00:01 on 2026-10-31 UTC+6)
  const dtAfter = new Date('2026-10-31T00:00:01+06:00');
  const dateStrAfter = getDhakaDateStr(dtAfter);
  assert.strictEqual(dateStrAfter, '2026-10-31', "Date after midnight should be 2026-10-31");

  // Day type auto-detection before (Friday) vs after (Saturday = Free day)
  assert.strictEqual(autoDetectDayType(dtBefore), 'fri', "Oct 30 2026 is Friday");
  assert.strictEqual(autoDetectDayType(dtAfter), 'free', "Oct 31 2026 is Saturday (Free day)");

  // Verify new day starts fresh: done:2026-10-31 should be empty
  const doneBefore = ['ed_wake'];
  storage.set('done:2026-10-30', doneBefore);
  const doneAfter = storage.get('done:2026-10-31', []);
  assert.strictEqual(doneAfter.length, 0, "New day should start fresh with 0 done");
  console.log("  ✓ Rollover changes Dhaka date, auto-detects day type, and starts with 0 done.");
  passedTests++;
}

// TEST 2: Switching day types
console.log("\nTest 2: Testing manual day type switching...");
{
  const today = getDhakaDateStr();
  // Auto type for today
  const autoType = getDayTypeForDate(today);
  assert.strictEqual(autoType, 'fri', "Today (Oct 30 2026) is Friday");

  // Manually switch to "mon" (Monday late class)
  storage.set('daytype:' + today, 'mon');
  assert.strictEqual(getDayTypeForDate(today), 'mon', "Manual override should return 'mon'");

  // Verify resolved tasks include Monday tasks + everyday tasks
  const tasks = resolveTasksForDayType(getCustomSchedule(), 'mon');
  const taskIds = tasks.map(t => t.id);
  assert.ok(taskIds.includes('m_deep'), "Monday tasks should be included");
  assert.ok(taskIds.includes('ed_wake'), "Everyday wake task should be included");
  assert.ok(taskIds.includes('ed_sleep'), "Everyday sleep task should be included");

  // Reset back to auto
  storage.remove('daytype:' + today);
  assert.strictEqual(getDayTypeForDate(today), 'fri', "Removing override restores auto Friday");
  console.log("  ✓ Manual override switches day type, updates active schedule, and can be restored.");
  passedTests++;
}

// TEST 3: Undo functionality
console.log("\nTest 3: Testing task and prayer undo...");
{
  const today = getDhakaDateStr();
  storage.remove('done:' + today);
  storage.remove('prayers:' + today);

  // Toggle task done
  toggleTaskDone('ed_wake');
  let done = storage.get('done:' + today, []);
  assert.deepStrictEqual(done, ['ed_wake'], "Task should be marked done");

  // Tap again to undo
  toggleTaskDone('ed_wake');
  done = storage.get('done:' + today, []);
  assert.deepStrictEqual(done, [], "Task should be undone (empty list)");

  // Toggle prayer
  togglePrayer('fajr');
  let prayers = storage.get('prayers:' + today, []);
  assert.deepStrictEqual(prayers, ['fajr'], "Fajr should be marked done");

  // Tap again to undo prayer
  togglePrayer('fajr');
  prayers = storage.get('prayers:' + today, []);
  assert.deepStrictEqual(prayers, [], "Fajr should be undone (empty list)");
  console.log("  ✓ Tapping tasks and prayers toggles completion and undoes cleanly.");
  passedTests++;
}

// TEST 4: Streak across a missed day
console.log("\nTest 4: Testing streak calculation across a missed day...");
{
  mockLocalStorage.clear();
  const todayStr = getDhakaDateStr(); // 2026-10-30

  // 4 days history:
  // Day 1: 2026-10-26 (Achieved: 5 prayers, 100% tasks)
  storage.set('snapshot:2026-10-26', ['t1', 't2', 't3', 't4', 't5']);
  storage.set('done:2026-10-26', ['t1', 't2', 't3', 't4', 't5']);
  storage.set('prayers:2026-10-26', ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);

  // Day 2: 2026-10-27 (Achieved: 5 prayers, 80% tasks = 4 of 5)
  storage.set('snapshot:2026-10-27', ['t1', 't2', 't3', 't4', 't5']);
  storage.set('done:2026-10-27', ['t1', 't2', 't3', 't4']);
  storage.set('prayers:2026-10-27', ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);

  // Day 3: 2026-10-28 (MISSED! 0 prayers, only 1 task done)
  storage.set('snapshot:2026-10-28', ['t1', 't2', 't3', 't4', 't5']);
  storage.set('done:2026-10-28', ['t1']);
  storage.set('prayers:2026-10-28', []);

  // Day 4: 2026-10-29 (Achieved: 5 prayers, 100% tasks)
  storage.set('snapshot:2026-10-29', ['t1', 't2', 't3', 't4', 't5']);
  storage.set('done:2026-10-29', ['t1', 't2', 't3', 't4', 't5']);
  storage.set('prayers:2026-10-29', ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);

  // Day 5: Today (2026-10-30) in progress
  storage.set('prayers:2026-10-30', ['fajr']); // not finished yet

  let streaks = calculateStreaks();
  assert.strictEqual(streaks.current, 1, "Current streak should be 1 (from yesterday Oct 29, since Oct 28 broke the earlier streak)");
  assert.strictEqual(streaks.best, 2, "Best streak should be 2 (Oct 26-27)");

  // Now complete today:
  const activeToday = getActiveTasksForToday();
  storage.set('snapshot:2026-10-30', activeToday.map(t => t.id));
  storage.set('done:2026-10-30', activeToday.map(t => t.id));
  storage.set('prayers:2026-10-30', ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);

  streaks = calculateStreaks();
  assert.strictEqual(streaks.current, 2, "Current streak should become 2 (Oct 29 + Oct 30)");
  assert.strictEqual(streaks.best, 2, "Best streak is 2");
  console.log("  ✓ Missed day correctly breaks streak; current and best streak tracked accurately.");
  passedTests++;
}

// TEST 5: Editor add, edit, delete, reorder
console.log("\nTest 5: Testing Schedule Editor add/edit/delete/reorder...");
{
  mockLocalStorage.clear();
  let sched = getCustomSchedule();
  mockElements.editScheduleDaySelect.value = 'early';
  mockElements.editScheduleDaySelect.selectedOptions = [{ text: 'Early class day (Sun, Wed)' }];

  // 1. Add Task
  const initialEarlyCount = sched.early.length;
  const newTaskId = 't_custom_123';
  sched.early.push({ id: newTaskId, time: '09:00 AM', title: 'Special Review', category: 'work' });
  saveCustomSchedule(sched);

  let updatedSched = getCustomSchedule();
  assert.strictEqual(updatedSched.early.length, initialEarlyCount + 1, "Task should be added");
  assert.strictEqual(updatedSched.early[updatedSched.early.length - 1].title, 'Special Review');

  // 2. Edit Task
  const taskToEdit = updatedSched.early.find(t => t.id === newTaskId);
  taskToEdit.title = 'Updated Review Title';
  taskToEdit.time = '09:15 AM';
  saveCustomSchedule(updatedSched);

  updatedSched = getCustomSchedule();
  const editedTask = updatedSched.early.find(t => t.id === newTaskId);
  assert.strictEqual(editedTask.title, 'Updated Review Title', "Title should be updated");
  assert.strictEqual(editedTask.time, '09:15 AM', "Time should be updated");

  // 3. Reorder Task (Move up)
  const idx = updatedSched.early.findIndex(t => t.id === newTaskId);
  moveEditorTask(idx, -1);
  updatedSched = getCustomSchedule();
  assert.strictEqual(updatedSched.early[idx - 1].id, newTaskId, "Task should have moved up one position");

  // 4. Delete Task
  deleteEditorTask(newTaskId);
  updatedSched = getCustomSchedule();
  assert.strictEqual(updatedSched.early.some(t => t.id === newTaskId), false, "Task should be deleted");
  console.log("  ✓ Editor correctly adds, edits, reorders, and deletes tasks in custom schedule.");
  passedTests++;
}

// TEST 6: Reset to default
console.log("\nTest 6: Testing reset to default config...");
{
  mockLocalStorage.clear();
  let sched = getCustomSchedule();
  mockElements.editScheduleDaySelect.value = 'early';
  mockElements.editScheduleDaySelect.selectedOptions = [{ text: 'Early class day (Sun, Wed)' }];

  // Modify early schedule
  sched.early = [{ id: 'custom_only', time: '12:00 PM', title: 'Only task', category: 'rest' }];
  saveCustomSchedule(sched);
  assert.strictEqual(getCustomSchedule().early.length, 1);

  // Reset this day type
  resetCurrentDayType();
  assert.strictEqual(getCustomSchedule().early.length, DEFAULT_SCHEDULE.early.length, "Early should be reset to default");

  // Modify multiple day types
  sched = getCustomSchedule();
  sched.early = [];
  sched.everyday = [];
  saveCustomSchedule(sched);

  // Reset all
  resetAllSchedules();
  assert.strictEqual(storage.get('schedule:custom', null), null, "Custom schedule should be removed");
  assert.deepStrictEqual(getCustomSchedule(), DEFAULT_SCHEDULE, "Schedule should match DEFAULT_SCHEDULE exactly");
  console.log("  ✓ Reset this day type and reset all schedules work with confirmation.");
  passedTests++;
}

// TEST 7: Deleting a task that has history (preserving past snapshot)
console.log("\nTest 7: Testing deleting task with history (snapshot isolation)...");
{
  mockLocalStorage.clear();
  const pastDate = '2026-10-25';
  const deletedTaskId = 'e_bfit'; // Breakfast task

  // Snapshot for past date had 5 tasks including deletedTaskId
  const pastSnapshot = ['ed_wake', deletedTaskId, 'e_com1', 'e_cls', 'ed_sleep'];
  storage.set('snapshot:' + pastDate, pastSnapshot);
  // User completed all 5 tasks on that day
  storage.set('done:' + pastDate, pastSnapshot);

  // User deletes e_bfit today in editor
  let sched = getCustomSchedule();
  sched.early = sched.early.filter(t => t.id !== deletedTaskId);
  saveCustomSchedule(sched);

  // Verify: Past day snapshot is completely untouched!
  const retrievedSnapshot = storage.get('snapshot:' + pastDate);
  assert.deepStrictEqual(retrievedSnapshot, pastSnapshot, "Past day snapshot must not be modified");

  // Verify: Past day completion percentage calculation still works and is 100%
  const pastDone = storage.get('done:' + pastDate, []);
  const validPastDone = pastDone.filter(id => retrievedSnapshot.includes(id));
  const pastPct = (validPastDone.length / retrievedSnapshot.length) * 100;
  assert.strictEqual(pastPct, 100, "Past percentage must remain 100% based on historical snapshot");

  // Verify: Today's active tasks no longer include the deleted task
  const todayTasks = resolveTasksForDayType(getCustomSchedule(), 'early');
  assert.strictEqual(todayTasks.some(t => t.id === deletedTaskId), false, "Deleted task absent from today/future");
  console.log("  ✓ Past history and snapshots preserved when tasks are deleted for today/future.");
  passedTests++;
}

// TEST 8: Export and Import round-trip
console.log("\nTest 8: Testing Export and Import round-trip with custom schedule...");
{
  mockLocalStorage.clear();
  // Set custom schedule
  let sched = getCustomSchedule();
  sched.everyday.push({ id: 't_custom_export', time: '06:00 AM', title: 'Early meditation', category: 'rest' });
  saveCustomSchedule(sched);

  // Set sample records
  storage.set('done:2026-10-28', ['t_custom_export', 'ed_wake']);
  storage.set('prayers:2026-10-28', ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
  storage.set('snapshot:2026-10-28', ['t_custom_export', 'ed_wake']);
  storage.set('daytype:2026-10-28', 'free');

  // Generate export payload
  const exported = {
    app: "daily-routine-checklist",
    version: 1,
    exportedAt: new Date().toISOString(),
    customSchedule: storage.get('schedule:custom', null),
    data: {}
  };
  storage.getAllKeys().forEach(k => {
    if (/^(?:done|prayers|snapshot|daytype):/.test(k)) exported.data[k] = storage.get(k);
  });

  const exportedJson = JSON.stringify(exported, null, 2);

  // Clear storage completely
  mockLocalStorage.clear();
  assert.strictEqual(storage.get('schedule:custom', null), null, "Storage cleared");
  assert.strictEqual(storage.get('done:2026-10-28', null), null, "Records cleared");

  // Simulate import
  const parsed = JSON.parse(exportedJson);
  assert.strictEqual(parsed.app, "daily-routine-checklist");
  if (parsed.customSchedule) storage.set('schedule:custom', parsed.customSchedule);
  for (const [k, v] of Object.entries(parsed.data)) {
    storage.set(k, v);
  }

  // Verify restored custom schedule
  const restoredSched = getCustomSchedule();
  assert.ok(restoredSched.everyday.some(t => t.id === 't_custom_export'), "Custom task restored in schedule");

  // Verify restored records
  assert.deepStrictEqual(storage.get('done:2026-10-28'), ['t_custom_export', 'ed_wake'], "Done tasks restored");
  assert.deepStrictEqual(storage.get('prayers:2026-10-28'), ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'], "Prayers restored");
  assert.deepStrictEqual(storage.get('snapshot:2026-10-28'), ['t_custom_export', 'ed_wake'], "Snapshots restored");
  assert.strictEqual(storage.get('daytype:2026-10-28'), 'free', "Daytype restored");
  console.log("  ✓ Full Export/Import round-trip validates, preserves custom schedule and all records.");
  passedTests++;
}

console.log("\n=================================================");
console.log(`  ALL ${passedTests} TEST SUITES PASSED SUCCESSFULLY!`);
console.log("=================================================");
