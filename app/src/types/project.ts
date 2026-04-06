export type CreateProject = {
    projectName: string;
    description: string;
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
    content: ProjectContent
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
}