const BASE_URL = 'http://localhost:3000';

async function registerTicket(idempotencyKey, payloadOverrides = {}) {
    const payload = {
        name: 'Ada',
        phone: '08012345678',
        language_preference: 'English',
        registration_channel: 'app',
        priority_level: 'virtual_walkin',
        visual_identifier: 'Blue Star',
        ...payloadOverrides,
    };

    const response = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
    });

    return {
        status: response.status,
        body: await response.json(),
    };
}

(async () => {
    console.log('Running concurrency and idempotency checks...');

    const sameKeyResults = await Promise.all(
        Array.from({ length: 10 }, () => registerTicket('same-key-repeat-test')),
    );

    const createdSameKey = sameKeyResults.filter((result) => result.status === 201);
    const uniqueSameKeyTicketIds = new Set(
        createdSameKey.map((result) => result.body.ticket?.id).filter(Boolean),
    );

    console.log('Same-key results:', JSON.stringify(sameKeyResults.map((result) => ({
        status: result.status,
        ticketId: result.body.ticket?.id ?? null,
        sequenceNumber: result.body.ticket?.sequence_number ?? null,
    })), null, 2));

    if (createdSameKey.length !== 1) {
        console.error(`FAIL: same idempotency key created ${createdSameKey.length} tickets instead of 1.`);
        process.exit(1);
    }

    if (uniqueSameKeyTicketIds.size !== 1) {
        console.error('FAIL: same idempotency key produced multiple ticket IDs.');
        process.exit(1);
    }

    const uniqueKeyResults = await Promise.all(
        Array.from({ length: 10 }, (_, index) => registerTicket(`unique-key-${index}`)),
    );

    const createdUniqueKey = uniqueKeyResults.filter((result) => result.status === 201);
    const sequenceNumbers = createdUniqueKey.map((result) => result.body.ticket?.sequence_number).filter(Number.isInteger);
    const duplicateSequenceNumbers = sequenceNumbers.filter((number, index) => sequenceNumbers.indexOf(number) !== index);

    console.log('Unique-key results:', JSON.stringify(uniqueKeyResults.map((result) => ({
        status: result.status,
        ticketId: result.body.ticket?.id ?? null,
        sequenceNumber: result.body.ticket?.sequence_number ?? null,
    })), null, 2));

    if (createdUniqueKey.length !== 10) {
        console.error(`FAIL: expected 10 unique tickets but got ${createdUniqueKey.length}.`);
        process.exit(1);
    }

    if (duplicateSequenceNumbers.length > 0) {
        console.error(`FAIL: duplicate sequence numbers were created: ${duplicateSequenceNumbers.join(', ')}`);
        process.exit(1);
    }

    console.log('PASS: idempotency and atomic ticket sequencing both hold under concurrent load.');
})();
