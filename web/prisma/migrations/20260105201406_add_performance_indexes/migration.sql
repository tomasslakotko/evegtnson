-- CreateIndex
CREATE INDEX "Booking_hostId_startTime_idx" ON "Booking"("hostId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_eventTypeId_startTime_idx" ON "Booking"("eventTypeId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_hostId_status_startTime_idx" ON "Booking"("hostId", "status", "startTime");

-- CreateIndex
CREATE INDEX "Booking_startTime_endTime_idx" ON "Booking"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "EventType_userId_idx" ON "EventType"("userId");

-- CreateIndex
CREATE INDEX "EventType_slug_idx" ON "EventType"("slug");

-- CreateIndex
CREATE INDEX "Schedule_userId_day_idx" ON "Schedule"("userId", "day");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
