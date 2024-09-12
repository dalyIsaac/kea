use git2::{Error, Repository};

const REPO_PATH: &str = "/workspaces/kea";
const TARGET_BRANCH: &str = "main";
// const SOURCE_BRANCH: &str = "compare";

fn main() -> Result<(), Error> {
    let repo = match Repository::open(REPO_PATH) {
        Ok(repo) => repo,
        Err(e) => panic!("failed to open: {}", e),
    };

    println!("Repo path: {}", repo.path().display());

    // Compare the working directory with the target branch
    let target_branch = repo.find_branch(TARGET_BRANCH, git2::BranchType::Local)?;

    let target_commit = target_branch.get().peel_to_commit()?;
    let target_tree = target_commit.tree()?;

    let diff = repo.diff_tree_to_workdir(Some(&target_tree), None)?;
    let stats = diff.stats()?;

    println!("Diff stats: {:?}", stats);

    // Compare the commits between the source and target branches
    let target_oid = target_commit.id();
    let head = repo.head()?;
    let head_oid = head.target().unwrap();

    let (ahead, behind) = repo.graph_ahead_behind(head_oid, target_oid)?;

    println!("Ahead: {}, Behind: {}", ahead, behind);

    // Do a revwalk to get the commit history between the source and target branches
    let mut revwalk = repo.revwalk()?;
    revwalk.push_range(&format!("{}..{}", target_oid, head_oid))?;

    for oid in revwalk {
        let commit = repo.find_commit(oid?)?;
        println!("Commit: {}", commit.summary().unwrap());
    }

    Ok(())
}
