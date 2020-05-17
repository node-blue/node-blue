// TODO: Fix event typing
// TODO: Fix triggerBuilder typing
export const getDefaultHandler = (triggerBuilder: any) => (event: any) => {
    const { data } = event;
    const { old_state, new_state } = data;

    // Check for entityId match, if set:
    if (triggerBuilder.entityId) {
        if (triggerBuilder.entityId !== data.entity_id) return false;
    }

    // Check if the state has changed at all:
    if (triggerBuilder.onlyStateChanges) {
        if (old_state.state === new_state.state) return false;
    }

    // Check for fromState match:
    if (triggerBuilder.fromState) {
        if (old_state.state !== triggerBuilder.fromState) return false;
    }

    // Check for toState match:
    if (triggerBuilder.toState) {
        if (new_state.state !== triggerBuilder.toState) return false;
    }

    // All checks passed!
    return true;
};
