-- CreateTable
CREATE TABLE "EventTypeHost" (
    "id" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTypeHost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventTypeHost_eventTypeId_userId_key" ON "EventTypeHost"("eventTypeId", "userId");

-- AddForeignKey
ALTER TABLE "EventTypeHost" ADD CONSTRAINT "EventTypeHost_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTypeHost" ADD CONSTRAINT "EventTypeHost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
