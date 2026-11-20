# My Tasks: ideas and missing features

## High priority

- [ ] Add a project selector to the task form so tasks can be assigned, moved, or unassigned when creating or editing them.
- [ ] Distinguish an empty task list from an empty filtered result, with actions to create a task or clear list filters.
- [ ] Add a retry action when tasks fail to load without losing the current view or list filters.
- [ ] Correct the list sort-direction tooltip so its description matches the selected order.
- [ ] Add end-to-end coverage for list filters and pagination, Kanban drag and keyboard interactions, failed updates, and expired sessions.

## Usability and performance

- [ ] Show the project in the list and add a project filter to that view; extend the API query to support it.
- [ ] Highlight overdue and upcoming due dates, taking the user's local date into account.
- [ ] Add an explicit way to clear a task's due date in the form.
- [ ] Offer duplicate and delete actions on Kanban cards with the same confirmation and error handling as the list.
- [ ] Improve Kanban performance for large collections while still displaying every task without list filters or pagination controls.
- [ ] Verify keyboard and screen-reader announcements for task moves, and check responsive behavior on narrow screens.

## Future ideas

- [ ] Add subtasks or checklists with progress on each task; this requires new data and API support.
- [ ] Add labels and label-based filtering in the list; this requires new data and API support.
- [ ] Support recurring tasks and due-date reminders; this requires scheduling and notification infrastructure.
