class MyQueue {
public:
    MyQueue() {
    }

    void push(int x) {
        inbox.push(x);
    }

    int pop() {
        refill();
        int x = outbox.top();
        outbox.pop();
        return x;
    }

    int peek() {
        refill();
        return outbox.top();
    }

    bool empty() {
        return inbox.empty() && outbox.empty();
    }

private:
    stack<int> inbox;  // newest on top
    stack<int> outbox; // oldest on top

    void refill() {
        // Only pour when outbox is empty — otherwise FIFO order breaks.
        if (outbox.empty()) {
            while (!inbox.empty()) {
                outbox.push(inbox.top());
                inbox.pop();
            }
        }
    }
};
