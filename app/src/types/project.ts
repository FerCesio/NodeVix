export type CreateProject = {
    projectName: string;
};

export type CreateResponse = {
    id: number;
    projectName: string;
    description: string;
    createdOn: string;
    modifiedOn: string;
};

export interface ProjectContent {

}

export type UpdateProject = {
    name: string;
    description: string
    content: string
    role?: "GUEST" | "EDITOR"| "OWNER"
}

export type UpdateResponse = {
    id: number
    name: string
    description: string
    createdOn: string
    modifiedOn: string
    projectContent: ProjectContent
}

export type DeleteResponse = {
    message: string
}

export type ReadListResponse = {
    id: number
    name: string
    description: string
    modifiedOn: string
    createdOn: string
    role: "OWNER"|"GUEST"|"EDITOR"
}