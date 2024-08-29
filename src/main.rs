use git2::Repository;

const REPO_PATH: &str = "/workspaces/kea";
const TARGET_BRANCH: &str = "main";
// const SOURCE_BRANCH: &str = "compare";

fn main() {
    let repo = match Repository::open(REPO_PATH) {
        Ok(repo) => repo,
        Err(e) => panic!("failed to open: {}", e),
    };

    println!("Repo path: {}", repo.path().display());

    // Compare the working directory with the target branch
    let target_branch = repo
        .find_branch(TARGET_BRANCH, git2::BranchType::Local)
        .unwrap();

    let target_commit = target_branch.get().peel_to_commit().unwrap();
    let target_tree = target_commit.tree().unwrap();

    let diff = repo.diff_tree_to_workdir(Some(&target_tree), None).unwrap();
    let stats = diff.stats().unwrap();

    println!("Diff stats: {:?}", stats);
}
