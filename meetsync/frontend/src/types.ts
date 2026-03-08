export type UserInfo = {
    uid: string;
    name: string;
    email: string;
};

export type FinalizedSlot = {
    date: string;
    startTime: string;
    endTime: string;
};

export type EventData = {
    eventId?: string;
    title: string;
    location: string;
    hostId?: string;
    hostName?: string;
    hostEmail?: string;
    status?: string;
    shareLink?: string;
    dateRange: {
        start: string;
        end: string;
    };
    timeRange: {
        start: string;
        end: string;
    };
    finalizedSlot?: FinalizedSlot;
};

export type AvailabilitySlot = {
    date: string;
    startTime: string;
    endTime: string;
};

export type OverlapItem = {
    date: string;
    time: string;
    count: number;
};