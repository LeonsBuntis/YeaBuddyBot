import { PagedAsyncIterableIterator } from "@azure/core-paging";
import { Container, CosmosClient, Database, FeedResponse, ItemResponse, SqlQuerySpec } from "@azure/cosmos";
import { DefaultAzureCredential, TokenCredential } from "@azure/identity";

import { cosmosConnectionString, cosmosDatabaseId, cosmosWorkoutsContainerId } from "../config.js";

export class Exercise {
    constructor(
        public userId: string,
        public name: string,
        public sets: Set[] = [],
    ) {}
}

export class Repository {
    private client: CosmosClient;
    private database: Database;
    private workoutsContainer: Container;

    constructor() {
        this.client = new CosmosClient(cosmosConnectionString);
        this.database = this.client.database(cosmosDatabaseId);
        this.workoutsContainer = this.database.container(cosmosWorkoutsContainerId);
    }

    public async saveWorkout(workout: Workout): Promise<ItemResponse<any>> {
        const response = await this.workoutsContainer.items.upsert(workout);
        console.log(`Workout saved with id: ${response.resource?.id}`);

        return response;
    }
}

export class Set {
    constructor(
        public weight: number,
        public reps: number,
    ) {}
}

export class Workout {
    public endTime: Date = new Date();
    public id: string;
    public partitionKey: number;

    constructor(
        public userId: number,
        public startTime: Date,
        public excercises: Exercise[] = [],
    ) {
        this.partitionKey = userId;
        this.id = Date.now().toString();
    }
}
