import { PagedAsyncIterableIterator } from "@azure/core-paging";
import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
import { Container, CosmosClient, Database, FeedResponse, ItemResponse, SqlQuerySpec } from "@azure/cosmos";
import { cosmosConnectionString, cosmosDatabaseId, cosmosWorkoutsContainerId } from "../config.js";

export class Set {
    constructor(
        public weight: number,
        public reps: number,
    ) {}
}

export class Exercise {
    constructor(
        public userId: string,
        public name: string,
        public sets: Array<Set> = [],
    ) {}
}

export class Workout {
    public partitionKey: number;
    public id: string;
    public endTime: Date = new Date();

    constructor(
        public userId: number,
        public startTime: Date,
        public excercises: Array<Exercise> = [],
    ) {
        this.partitionKey = userId;
        this.id = Date.now().toString();
    }
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
        let response = await this.workoutsContainer.items.upsert(workout);
        console.log(`Workout saved with id: ${response.resource?.id}`);

        return response;
    }
}
